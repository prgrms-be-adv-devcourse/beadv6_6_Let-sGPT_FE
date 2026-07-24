import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";
import { AdminChatbot } from "../ui/AdminChatbot";

const encoder = new TextEncoder();
const requestId = "11111111-1111-4111-8111-111111111111";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function sse(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

function completedEvents(answer: string): string[] {
  return [
    sse("started", { requestId }),
    sse("status", { requestId, stage: "ANALYZING" }),
    sse("status", { requestId, stage: "GENERATING" }),
    sse("delta", { requestId, text: answer }),
    sse("done", { requestId }),
  ];
}

function retryableErrorEvents(message: string): string[] {
  return [
    sse("started", { requestId }),
    sse("error", {
      requestId,
      code: "CHAT_TIMEOUT",
      message,
      retryable: true,
      partial: false,
    }),
  ];
}

function streamResponse(events: string[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });
  return new HttpResponse(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
  });
}

function openStream(
  initialEvents: string[],
  capture: (controller: ReadableStreamDefaultController<Uint8Array>) => void,
  onCancel?: () => void,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      capture(controller);
      for (const event of initialEvents) {
        controller.enqueue(encoder.encode(event));
      }
    },
    cancel() {
      onCancel?.();
    },
  });
  return new HttpResponse(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
  });
}

async function ask(user: ReturnType<typeof userEvent.setup>, question: string) {
  const input = screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" });
  await user.type(input, question);
  await user.keyboard("{Enter}");
  return input;
}

async function askLongQuestion(user: ReturnType<typeof userEvent.setup>, question: string) {
  const input = screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" });
  fireEvent.change(input, { target: { value: question } });
  await user.click(screen.getByRole("button", { name: "질문 보내기" }));
}

describe("관리자 AI 대화 흐름", () => {
  it("첫 화면은 과도한 기능 목록이나 민감정보 경고 없이 질문 예시만 보여준다", async () => {
    render(<AdminChatbot />, { wrapper });

    expect(
      await screen.findByRole("heading", { name: "무엇을 도와드릴까요?" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("지난달 주문금액과 주별 추이를 알려줘")).toBeInTheDocument();
    expect(screen.getByText("지난주 결제 성공률과 환불액은?")).toBeInTheDocument();
    expect(screen.getByText("지난달 최종 정산액과 수수료를 알려줘")).toBeInTheDocument();
    expect(screen.queryByText(/현재 지원|연결 예정/)).not.toBeInTheDocument();
    expect(screen.queryByText(/개인정보|비밀정보|원시 식별값/)).not.toBeInTheDocument();
  });

  it("상태와 답변 조각을 자연스럽게 스트리밍하고 완료한다", async () => {
    const user = userEvent.setup();
    let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        openStream(
          [sse("started", { requestId }), sse("status", { requestId, stage: "ANALYZING" })],
          (value) => {
            controller = value;
          },
        ),
      ),
    );
    render(<AdminChatbot />, { wrapper });

    await ask(user, "지난달 주문 수와 주별 추이를 알려줘");

    expect(await screen.findByText("질문을 이해하고 있어요")).toBeInTheDocument();
    const aiHeading = screen.getByText("openAt AI").parentElement;
    expect(aiHeading?.querySelector('[data-chat-loading-indicator="true"]')).toHaveClass(
      "animate-spin",
    );

    await act(async () => {
      controller?.enqueue(encoder.encode(sse("status", { requestId, stage: "CALLING_TOOL" })));
    });
    expect(await screen.findByText("필요한 정보를 확인하고 있어요")).toBeInTheDocument();

    await act(async () => {
      controller?.enqueue(encoder.encode(sse("status", { requestId, stage: "GENERATING" })));
      controller?.enqueue(encoder.encode(sse("delta", { requestId, text: "지난달 주문은 " })));
    });
    await waitFor(() =>
      expect(document.querySelector('[data-chat-streaming-answer="true"]')).toHaveTextContent(
        "지난달 주문은",
      ),
    );
    expect(document.querySelector('[data-chat-stream-cursor="true"]')).toBeInTheDocument();

    await act(async () => {
      controller?.enqueue(encoder.encode(sse("delta", { requestId, text: "총 1,284건이야." })));
      controller?.enqueue(encoder.encode(sse("done", { requestId })));
      controller?.close();
    });

    expect(await screen.findByText("지난달 주문은 총 1,284건이야.")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        document.querySelector('[data-chat-loading-indicator="true"]'),
      ).not.toBeInTheDocument(),
    );
    expect(document.querySelector('[data-chat-stream-cursor="true"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/ORCHESTRATED|도구 선택|스키마|라우트/)).not.toBeInTheDocument();
  });

  it("가장 최근 완료 답변 하나만 유니코드를 보존해 후속 질문에 전달한다", async () => {
    const user = userEvent.setup();
    const requests: Array<Record<string, unknown>> = [];
    const previousQuestion = `${"가".repeat(299)}😀끝`;
    const previousAnswer = `${"답".repeat(799)}😀끝`;
    server.use(
      http.post("*/api/v1/ai/chats", async ({ request }) => {
        requests.push((await request.json()) as Record<string, unknown>);
        return streamResponse(
          completedEvents(requests.length === 1 ? previousAnswer : "지난달 결과야."),
        );
      }),
    );
    render(<AdminChatbot />, { wrapper });

    await askLongQuestion(user, previousQuestion);
    expect(await screen.findByText(previousAnswer)).toBeInTheDocument();
    await ask(user, "그럼 지난달은?");
    expect(await screen.findByText("지난달 결과야.")).toBeInTheDocument();

    expect(requests).toHaveLength(2);
    expect(requests[0]).toEqual({ message: previousQuestion });
    expect(requests[1]).toEqual({
      message: "그럼 지난달은?",
      previousTurn: {
        question: "가".repeat(299),
        answer: "답".repeat(799),
      },
    });
  });

  it("실패한 턴을 문맥에서 제외하고 재시도에는 원래 요청 문맥을 유지한다", async () => {
    const user = userEvent.setup();
    const requests: Array<Record<string, unknown>> = [];
    server.use(
      http.post("*/api/v1/ai/chats", async ({ request }) => {
        requests.push((await request.json()) as Record<string, unknown>);
        if (requests.length === 2) {
          return streamResponse(retryableErrorEvents("두 번째 질문이 실패했어."));
        }
        return streamResponse(
          completedEvents(requests.length === 1 ? "첫 번째 답변이야." : "완료된 답변이야."),
        );
      }),
    );
    render(<AdminChatbot />, { wrapper });

    await ask(user, "첫 번째 질문");
    expect(await screen.findByText("첫 번째 답변이야.")).toBeInTheDocument();

    await ask(user, "실패할 질문");
    expect(await screen.findByRole("alert")).toHaveTextContent("두 번째 질문이 실패했어.");

    await ask(user, "새 질문");
    expect(await screen.findByText("완료된 답변이야.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(requests).toHaveLength(4));

    const originalFailedRequest = {
      message: "실패할 질문",
      previousTurn: {
        question: "첫 번째 질문",
        answer: "첫 번째 답변이야.",
      },
    };
    expect(requests[1]).toEqual(originalFailedRequest);
    expect(requests[2]).toEqual({
      message: "새 질문",
      previousTurn: {
        question: "첫 번째 질문",
        answer: "첫 번째 답변이야.",
      },
    });
    expect(requests[3]).toEqual(originalFailedRequest);
  });

  it("부분 답변 뒤 오류가 나면 받은 문장을 보존하고 재시도를 제공한다", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        streamResponse([
          sse("started", { requestId }),
          sse("status", { requestId, stage: "ANALYZING" }),
          sse("status", { requestId, stage: "GENERATING" }),
          sse("delta", { requestId, text: "먼저 확인된 내용이야." }),
          sse("error", {
            requestId,
            code: "CHAT_TIMEOUT",
            message: "답변 생성 시간이 오래 걸렸어.",
            retryable: true,
            partial: true,
          }),
        ]),
      ),
    );
    render(<AdminChatbot />, { wrapper });

    await ask(user, "질문");

    expect(await screen.findByText("먼저 확인된 내용이야.")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("답변 생성 시간이 오래 걸렸어.");
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeEnabled();
  });

  it("사용자가 중지하면 스트림을 취소하고 같은 질문을 다시 시도할 수 있다", async () => {
    const user = userEvent.setup();
    const requests: Array<Record<string, unknown>> = [];
    server.use(
      http.post("*/api/v1/ai/chats", async ({ request }) => {
        requests.push((await request.json()) as Record<string, unknown>);
        return requests.length === 1
          ? openStream(
              [sse("started", { requestId }), sse("status", { requestId, stage: "ANALYZING" })],
              () => undefined,
            )
          : streamResponse(completedEvents("새 질문의 답변이야."));
      }),
    );
    render(<AdminChatbot />, { wrapper });

    await ask(user, "오래 걸리는 질문");
    await screen.findByText("질문을 이해하고 있어요");
    await user.click(screen.getByRole("button", { name: "답변 생성 중지" }));

    expect(await screen.findByText("답변 생성을 중지했어.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeEnabled();

    await ask(user, "중지 뒤 새 질문");
    expect(await screen.findByText("새 질문의 답변이야.")).toBeInTheDocument();
    expect(requests).toEqual([{ message: "오래 걸리는 질문" }, { message: "중지 뒤 새 질문" }]);
  });

  it("답변 중 새 질문을 보내면 이전 요청을 취소하고 즉시 교체한다", async () => {
    const user = userEvent.setup();
    const requests: Array<Record<string, unknown>> = [];
    const replacedRequestAborted = vi.fn();
    server.use(
      http.post("*/api/v1/ai/chats", async ({ request }) => {
        requests.push((await request.json()) as Record<string, unknown>);
        if (requests.length === 1) {
          return streamResponse(completedEvents("교체 전 기준 답변이야."));
        }
        if (requests.length === 2) {
          request.signal.addEventListener("abort", replacedRequestAborted, { once: true });
          return openStream(
            [
              sse("started", { requestId }),
              sse("status", { requestId, stage: "ANALYZING" }),
              sse("status", { requestId, stage: "GENERATING" }),
              sse("delta", { requestId, text: "먼저 받은 부분 답변이야." }),
            ],
            () => undefined,
          );
        }
        return streamResponse(completedEvents("새 질문으로 교체한 답변이야."));
      }),
    );
    render(<AdminChatbot />, { wrapper });

    await ask(user, "교체 전 기준 질문");
    expect(await screen.findByText("교체 전 기준 답변이야.")).toBeInTheDocument();
    await ask(user, "오래 걸리는 첫 질문");
    expect(await screen.findByText("먼저 받은 부분 답변이야.")).toBeInTheDocument();

    const input = screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" });
    expect(input).not.toHaveAttribute("readonly");
    await user.type(input, "바로 이어서 할 새 질문");
    expect(screen.getByRole("button", { name: "현재 답변을 중지하고 질문 보내기" })).toBeEnabled();
    await user.keyboard("{Enter}");

    expect(await screen.findByText("답변 생성을 중지했어.")).toBeInTheDocument();
    expect(screen.getByText("먼저 받은 부분 답변이야.")).toBeInTheDocument();
    expect(await screen.findByText("새 질문으로 교체한 답변이야.")).toBeInTheDocument();
    await waitFor(() => expect(replacedRequestAborted).toHaveBeenCalledOnce());
    expect(requests).toEqual([
      { message: "교체 전 기준 질문" },
      {
        message: "오래 걸리는 첫 질문",
        previousTurn: {
          question: "교체 전 기준 질문",
          answer: "교체 전 기준 답변이야.",
        },
      },
      {
        message: "바로 이어서 할 새 질문",
        previousTurn: {
          question: "교체 전 기준 질문",
          answer: "교체 전 기준 답변이야.",
        },
      },
    ]);
  });

  it("부드러운 자동 스크롤을 사용하고 모션 축소 설정을 존중한다", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => undefined);
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      render(<AdminChatbot />, { wrapper });
      await ask(user, "엑셀이 뭐야?");

      await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "smooth" });
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView;
      scrollBy.mockRestore();
    }
  });
});

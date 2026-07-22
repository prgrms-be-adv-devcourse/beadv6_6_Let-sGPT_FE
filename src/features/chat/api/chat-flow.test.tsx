import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";
import { AdminChatbot } from "../ui/AdminChatbot";

const encoder = new TextEncoder();

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function sse(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
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

function domRect(top: number, bottom: number): DOMRect {
  return {
    x: 0,
    y: top,
    width: 0,
    height: bottom - top,
    top,
    right: 0,
    bottom,
    left: 0,
    toJSON: () => ({}),
  };
}

describe("관리자 AI 어시스턴트 플로우", () => {
  it("활성 capability의 추천 질문만 최대 3개 보여 준다", async () => {
    render(<AdminChatbot />, { wrapper });

    expect(screen.getByRole("heading", { name: "무엇을 도와드릴까요?" })).toBeInTheDocument();
    const suggestions = await screen.findByRole("list", { name: "추천 질문" });
    expect(suggestions.querySelectorAll("button")).toHaveLength(3);
    expect(screen.getByText("현재 지원").parentElement).toHaveTextContent("일반 질문");
    expect(screen.getByText(/연결 예정/)).toHaveTextContent("고정 지표");
  });

  it("한 개의 message를 POST하고 raw Markdown·HTML을 일반 텍스트로 표시한다", async () => {
    const answer = "**강조하지 않은 원문** <strong>안전한 텍스트</strong>";
    let receivedBody: unknown;
    server.use(
      http.post("*/api/v1/ai/chats", async ({ request }) => {
        receivedBody = await request.json();
        return streamResponse([
          sse("status", { stage: "GENERATING", route: "GENERAL_ANSWER" }),
          sse("message", { text: answer }),
          sse("done", { route: "GENERAL_ANSWER" }),
        ]);
      }),
    );
    const user = userEvent.setup();
    const { container } = render(<AdminChatbot />, { wrapper });

    const input = screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" });
    await user.type(input, "피벗 테이블이 뭐야?");
    await user.keyboard("{Enter}");

    expect(await screen.findByText(answer)).toBeInTheDocument();
    expect(receivedBody).toEqual({ message: "피벗 테이블이 뭐야?" });
    expect(container.querySelector("strong")).toBeNull();
    expect(screen.getByText("일반 답변")).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("Shift+Enter는 줄바꿈하고 Enter는 작성한 전체 질문을 전송한다", async () => {
    let receivedBody: unknown;
    server.use(
      http.post("*/api/v1/ai/chats", async ({ request }) => {
        receivedBody = await request.json();
        return streamResponse([
          sse("message", { text: "줄바꿈 질문에 대한 답변" }),
          sse("done", { route: "GENERAL_ANSWER" }),
        ]);
      }),
    );
    const user = userEvent.setup();
    render(<AdminChatbot />, { wrapper });

    const input = screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" });
    await user.click(input);
    await user.keyboard("첫째 줄{Shift>}{Enter}{/Shift}둘째 줄");

    expect(input).toHaveValue("첫째 줄\n둘째 줄");

    await user.keyboard("{Enter}");

    expect(await screen.findByText("줄바꿈 질문에 대한 답변")).toBeInTheDocument();
    expect(receivedBody).toEqual({ message: "첫째 줄\n둘째 줄" });
  });

  it("연속 질문을 보낼 때마다 새 질문 정렬을 먼저 수행한다", async () => {
    const streamControllers: ReadableStreamDefaultController<Uint8Array>[] = [];
    server.use(
      http.post("*/api/v1/ai/chats", () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            streamControllers.push(controller);
            controller.enqueue(encoder.encode(sse("status", { stage: "GENERATING" })));
          },
        });
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView",
    );
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    try {
      const user = userEvent.setup();
      render(<AdminChatbot />, { wrapper });
      const input = screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" });

      await user.type(input, "첫 번째 질문을 설명해줘");
      await user.keyboard("{Enter}");
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));

      await act(async () => {
        streamControllers[0]?.enqueue(encoder.encode(sse("done", { route: "GENERAL_ANSWER" })));
        streamControllers[0]?.close();
      });
      await waitFor(() => expect(input).not.toHaveAttribute("readonly"));

      await user.type(input, "두 번째 질문을 설명해줘");
      await user.keyboard("{Enter}");
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(2));
      expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "start", behavior: "auto" });

      await act(async () => {
        streamControllers[1]?.enqueue(encoder.encode(sse("done", { route: "GENERAL_ANSWER" })));
        streamControllers[1]?.close();
      });
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
      }
    }
  });

  it("done 없는 부분 응답을 보존하고 다시 시도할 수 있는 실패로 표시한다", async () => {
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        streamResponse([sse("delta", { text: "여기까지 받은 답변" })]),
      ),
    );
    const user = userEvent.setup();
    render(<AdminChatbot />, { wrapper });

    await user.type(
      screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" }),
      "설명해줘",
    );
    await user.click(screen.getByRole("button", { name: "질문 보내기" }));

    expect(await screen.findByText("여기까지 받은 답변")).toBeInTheDocument();
    expect(await screen.findByText("완료 이벤트 없이 응답이 종료되었습니다.")).toBeInTheDocument();
    expect(screen.getByText(/먼저 받은 내용은 남겨두었지만/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeEnabled();
  });

  it("스트리밍 중지 시 연결을 취소하고 입력을 다시 활성화한다", async () => {
    server.use(
      http.post("*/api/v1/ai/chats", () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode(sse("status", { stage: "GENERATING" })));
            controller.enqueue(encoder.encode(sse("delta", { text: "작성 중인 답변" })));
          },
        });
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );
    const user = userEvent.setup();
    render(<AdminChatbot />, { wrapper });

    await user.type(
      screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" }),
      "긴 답변을 작성해줘",
    );
    await user.click(screen.getByRole("button", { name: "질문 보내기" }));
    await screen.findByText("답변을 작성하고 있어요");
    const input = screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" });
    expect(input).toHaveAttribute("readonly");

    await user.keyboard("{Escape}");

    const cancellation = await screen.findByRole("status");
    expect(cancellation).toHaveTextContent("답변 생성을 중지했습니다.");
    expect(cancellation).toHaveAttribute("aria-live", "polite");
    expect(cancellation).toHaveAttribute("aria-atomic", "true");
    expect(input).not.toHaveAttribute("readonly");
    expect(input).toHaveFocus();
  });

  it("모바일 입력에서는 답변 종료 후 소프트 키보드를 다시 열지 않는다", async () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) =>
        ({
          matches: query === "(pointer: coarse)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        }) satisfies MediaQueryList,
    });
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        streamResponse([
          sse("message", { text: "모바일 답변" }),
          sse("done", { route: "GENERAL_ANSWER" }),
        ]),
      ),
    );

    try {
      const user = userEvent.setup();
      render(<AdminChatbot />, { wrapper });
      const input = screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" });

      await user.type(input, "모바일 사용성을 설명해줘");
      await user.keyboard("{Enter}");

      expect(await screen.findByText("모바일 답변")).toBeInTheDocument();
      expect(input).not.toHaveFocus();
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

  it("취소 렌더링으로 화면이 움직이면 현재 질문을 기준으로 위치를 복원한다", async () => {
    server.use(
      http.post("*/api/v1/ai/chats", () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode(sse("status", { stage: "GENERATING" })));
          },
        });
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => undefined);
    const getBoundingClientRect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const cancelled = document.body.textContent?.includes("답변 생성을 중지했습니다.");
        if (this.tagName === "ARTICLE") {
          return cancelled ? domRect(-196, -22) : domRect(96, 241);
        }
        if (this.getAttribute("data-chat-composer") === "true") {
          return domRect(677, 828);
        }
        if (this.tagName === "SPAN") {
          return domRect(240, 241);
        }
        return domRect(0, 0);
      });

    try {
      const user = userEvent.setup();
      render(<AdminChatbot />, { wrapper });
      await user.type(
        screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" }),
        "긴 답변을 작성해줘",
      );
      await user.keyboard("{Enter}");
      await screen.findByText("답변을 작성하고 있어요");

      await user.keyboard("{Escape}");

      await waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ top: -292, behavior: "auto" }));
    } finally {
      scrollBy.mockRestore();
      getBoundingClientRect.mockRestore();
    }
  });

  it("서버 error 이벤트의 재시도 가능 여부를 화면에 반영한다", async () => {
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        streamResponse([
          sse("error", {
            code: "INFERENCE_BUSY",
            message: "답변 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
            retryable: true,
            partial: false,
          }),
        ]),
      ),
    );
    const user = userEvent.setup();
    render(<AdminChatbot />, { wrapper });

    await user.type(screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" }), "질문");
    await user.click(screen.getByRole("button", { name: "질문 보내기" }));

    expect(await screen.findByText(/답변 요청이 많습니다/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeEnabled();
  });

  it("스트리밍 중에는 답변 영역을 busy로 표시하고 완료 답변은 한 번만 안내한다", async () => {
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
    server.use(
      http.post("*/api/v1/ai/chats", () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            streamController = controller;
            controller.enqueue(encoder.encode(sse("status", { stage: "ROUTING", route: null })));
            controller.enqueue(
              encoder.encode(sse("status", { stage: "GENERATING", route: "GENERAL_ANSWER" })),
            );
            controller.enqueue(encoder.encode(sse("delta", { text: "완성될 답변" })));
          },
        });
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );
    const user = userEvent.setup();
    render(<AdminChatbot />, { wrapper });

    await user.type(
      screen.getByRole("textbox", { name: "AI 어시스턴트에게 질문하기" }),
      "접근성을 설명해줘",
    );
    await user.click(screen.getByRole("button", { name: "질문 보내기" }));

    const visualAnswer = await screen.findByText("완성될 답변");
    const answerRegion = screen.getByRole("region", { name: "AI 답변" });
    expect(answerRegion).toHaveAttribute("aria-busy", "true");
    expect(visualAnswer).not.toHaveAttribute("aria-live");
    expect(screen.getByRole("status")).toHaveTextContent("답변을 작성하고 있어요");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByText(/AI 답변이 완료됐습니다/)).not.toBeInTheDocument();

    await act(async () => {
      streamController?.enqueue(encoder.encode(sse("done", { route: "GENERAL_ANSWER" })));
      streamController?.close();
    });

    const completion = await screen.findByText("AI 답변이 완료됐습니다. 일반 답변.");
    expect(completion).toHaveAttribute("role", "status");
    expect(completion).toHaveAttribute("aria-live", "polite");
    expect(completion).toHaveAttribute("aria-atomic", "true");
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(answerRegion).toHaveAttribute("aria-busy", "false");
  });
});

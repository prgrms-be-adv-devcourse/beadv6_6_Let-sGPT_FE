import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import type { ChatRoute, ChatStreamEvent } from "../model/chat.schema";
import { ChatProtocolError, streamAdminChat } from "./chat.api";

const encoder = new TextEncoder();

function sse(type: string, data: unknown, lineEnding = "\n"): string {
  return `event: ${type}${lineEnding}data: ${JSON.stringify(data)}${lineEnding}${lineEnding}`;
}

function streamResponse(chunks: Uint8Array[], contentType = "text/event-stream"): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
  return new HttpResponse(stream, { headers: { "Content-Type": contentType } });
}

describe("관리자 AI SSE API", () => {
  const defaultContractCases = [
    {
      message: "엑셀 피벗 테이블을 쉽게 설명해줘",
      route: "GENERAL_ANSWER",
      eventTypes: ["status", "status", "delta", "done"],
      answer: "피벗 테이블은",
    },
    {
      message: "부천 날씨 알려줘",
      route: "UNSUPPORTED",
      eventTypes: ["status", "message", "done"],
      answer: "실시간 정보 도구는 아직 연결하지 않았어요.",
    },
    {
      message: "오늘 주문 수 알려줘",
      route: "UNSUPPORTED",
      eventTypes: ["status", "message", "done"],
      answer: "관리자 데이터와 내부 정책 조회는 아직 연결하지 않았어요.",
    },
    {
      message: "이메일을 보내줘",
      route: "UNSUPPORTED",
      eventTypes: ["status", "message", "done"],
      answer: "업무를 대신 실행하는 기능은 아직 제공하지 않아요.",
    },
    {
      message: "주문 취소해줘",
      route: "UNSUPPORTED",
      eventTypes: ["status", "message", "done"],
      answer: "업무를 대신 실행하는 기능은 아직 제공하지 않아요.",
    },
    {
      message: "그거 더 자세히 설명해줘",
      route: "CLARIFICATION",
      eventTypes: ["status", "message", "done"],
      answer: "현재는 질문마다 독립적으로 처리하고 있어요.",
    },
    {
      message: "홍길동 집 주소 알려줘",
      route: "UNSUPPORTED",
      eventTypes: ["status", "message", "done"],
      answer: "개인정보나 비밀 값을 조회하는 질문은 아직 처리하지 않아요.",
    },
    {
      message: "DAU 알려줘",
      route: "UNSUPPORTED",
      eventTypes: ["status", "message", "done"],
      answer: "관리자 데이터와 내부 정책 조회는 아직 연결하지 않았어요.",
    },
    {
      message: "최신 React 버전은?",
      route: "UNSUPPORTED",
      eventTypes: ["status", "message", "done"],
      answer: "실시간 정보 도구는 아직 연결하지 않았어요.",
    },
    {
      message: "아폴로 건 확인해줘",
      route: "UNSUPPORTED",
      eventTypes: ["status", "message", "done"],
      answer: "현재는 일반 개념 설명과 글쓰기 요청만 처리해요.",
    },
    {
      message: "주문이 성립하는 일반적인 과정을 설명해줘",
      route: "GENERAL_ANSWER",
      eventTypes: ["status", "status", "delta", "done"],
      answer: "복잡한 업무는",
    },
  ] satisfies Array<{
    message: string;
    route: ChatRoute;
    eventTypes: ChatStreamEvent["type"][];
    answer: string;
  }>;

  it.each(defaultContractCases)("기본 MSW가 '$message'를 실제 최소 계약에 맞게 처리한다", async ({
    message,
    route,
    eventTypes,
    answer,
  }) => {
    const events: ChatStreamEvent[] = [];

    await streamAdminChat({ message }, (event) => events.push(event), new AbortController().signal);

    expect(events.map((event) => event.type)).toEqual(eventTypes);
    expect(events[0]).toEqual({
      type: "status",
      data: { stage: "ROUTING", route: null },
    });
    expect(events.at(-1)).toEqual({ type: "done", data: { route } });
    expect(
      events
        .flatMap((event) =>
          event.type === "message" || event.type === "delta" ? [event.data.text] : [],
        )
        .join(""),
    ).toContain(answer);
  });

  it("CRLF·heartbeat와 바이트 경계로 분할된 이벤트를 순서대로 읽는다", async () => {
    const payload = [
      ": heartbeat\r\n\r\n",
      sse("status", { stage: "ROUTING", route: null }, "\r\n"),
      sse("delta", { text: "안녕하세요" }, "\r\n"),
      sse("done", { route: "GENERAL_ANSWER" }, "\r\n"),
    ].join("");
    const bytes = encoder.encode(payload);
    const first = Math.min(17, bytes.length);
    const second = Math.min(first + 23, bytes.length);
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        streamResponse([bytes.slice(0, first), bytes.slice(first, second), bytes.slice(second)]),
      ),
    );
    const events: ChatStreamEvent[] = [];

    await streamAdminChat(
      { message: "인사해줘" },
      (event) => events.push(event),
      new AbortController().signal,
    );

    expect(events).toEqual([
      { type: "status", data: { stage: "ROUTING", route: null } },
      { type: "delta", data: { text: "안녕하세요" } },
      { type: "done", data: { route: "GENERAL_ANSWER" } },
    ]);
  });

  it("done 없이 EOF가 오면 이미 받은 delta를 전달한 뒤 프로토콜 실패로 처리한다", async () => {
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        streamResponse([encoder.encode(sse("delta", { text: "부분 답변" }))]),
      ),
    );
    const events: ChatStreamEvent[] = [];

    const request = streamAdminChat(
      { message: "질문" },
      (event) => events.push(event),
      new AbortController().signal,
    );

    await expect(request).rejects.toBeInstanceOf(ChatProtocolError);
    expect(events).toEqual([{ type: "delta", data: { text: "부분 답변" } }]);
  });

  it("error 이벤트를 전달하고 서버 오류 정보로 실패한다", async () => {
    const payload = {
      code: "INFERENCE_UNAVAILABLE",
      message: "답변 모델에 연결하지 못했습니다.",
      retryable: true,
      partial: false,
    };
    server.use(
      http.post("*/api/v1/ai/chats", () => streamResponse([encoder.encode(sse("error", payload))])),
    );
    const events: ChatStreamEvent[] = [];

    const request = streamAdminChat(
      { message: "질문" },
      (event) => events.push(event),
      new AbortController().signal,
    );

    await expect(request).rejects.toMatchObject({ payload });
    expect(events).toEqual([{ type: "error", data: payload }]);
  });

  it("AbortSignal이 취소되면 대기 중인 스트림 읽기를 중단한다", async () => {
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
    const controller = new AbortController();
    const request = streamAdminChat({ message: "긴 답변" }, () => undefined, controller.signal);

    await Promise.resolve();
    controller.abort(new DOMException("테스트 취소", "AbortError"));

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });

  it("SSE가 아닌 Content-Type을 거부한다", async () => {
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        HttpResponse.json({ message: "stream contract mismatch" }),
      ),
    );

    await expect(
      streamAdminChat({ message: "질문" }, () => undefined, new AbortController().signal),
    ).rejects.toBeInstanceOf(ChatProtocolError);
  });
});

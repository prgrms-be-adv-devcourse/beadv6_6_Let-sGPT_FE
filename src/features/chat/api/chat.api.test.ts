import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import { type ChatStreamEvent, chatRequestSchema } from "../model/chat.schema";
import {
  ChatEventError,
  ChatProtocolError,
  getChatCapabilities,
  streamAdminChat,
} from "./chat.api";

const encoder = new TextEncoder();
const REQUEST_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_REQUEST_ID = "22222222-2222-4222-8222-222222222222";

function sse(type: string, data: unknown, lineEnding = "\n"): string {
  return `event: ${type}${lineEnding}data: ${JSON.stringify(data)}${lineEnding}${lineEnding}`;
}

function streamResponse(chunks: Array<string | Uint8Array>, contentType = "text/event-stream") {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
      }
      controller.close();
    },
  });
  return new HttpResponse(stream, { headers: { "Content-Type": contentType } });
}

function directEvents(text = "엑셀은 스프레드시트 프로그램이야.") {
  return [
    sse("started", { requestId: REQUEST_ID }),
    sse("status", { requestId: REQUEST_ID, stage: "ANALYZING" }),
    sse("status", { requestId: REQUEST_ID, stage: "GENERATING" }),
    sse("delta", { requestId: REQUEST_ID, text }),
    sse("done", { requestId: REQUEST_ID }),
  ];
}

function toolEvents() {
  return [
    sse("started", { requestId: REQUEST_ID }),
    sse("status", { requestId: REQUEST_ID, stage: "ANALYZING" }),
    sse("status", { requestId: REQUEST_ID, stage: "CALLING_TOOL" }),
    sse("status", { requestId: REQUEST_ID, stage: "GENERATING" }),
    sse("delta", { requestId: REQUEST_ID, text: "지난달 주문은 " }),
    sse("delta", { requestId: REQUEST_ID, text: "총 1,284건이야." }),
    sse("done", { requestId: REQUEST_ID }),
  ];
}

async function collect(message = "엑셀이 뭐야?"): Promise<ChatStreamEvent[]> {
  const events: ChatStreamEvent[] = [];
  await streamAdminChat({ message }, (event) => events.push(event), new AbortController().signal);
  return events;
}

describe("관리자 AI SSE API", () => {
  it("새 Spring AI capability 계약을 검증한다", async () => {
    const capabilities = await getChatCapabilities();

    expect(capabilities.prototype).toBe(false);
    expect(capabilities.capabilities.map((capability) => capability.type)).toEqual([
      "ORDER",
      "PAYMENT_REFUND",
      "SETTLEMENT",
      "MEMBER",
      "PRODUCT_DROP",
      "RELIABILITY",
      "OPERATIONS",
      "WEATHER",
      "WEB_SEARCH",
      "GENERAL",
    ]);
  });

  it("일반 질문의 자연어 delta 응답을 전달한다", async () => {
    server.use(http.post("*/api/v1/ai/chats", () => streamResponse(directEvents())));

    const events = await collect();

    expect(events.map((event) => event.type)).toEqual([
      "started",
      "status",
      "status",
      "delta",
      "done",
    ]);
  });

  it("첫 질문은 문맥 없이 보내고 후속 질문은 직전 완료 문맥을 함께 보낸다", async () => {
    const requests: unknown[] = [];
    server.use(
      http.post("*/api/v1/ai/chats", async ({ request }) => {
        requests.push(await request.json());
        return streamResponse(directEvents());
      }),
    );

    await streamAdminChat(
      { message: "이번 달 주문 수는?" },
      () => undefined,
      new AbortController().signal,
    );
    await streamAdminChat(
      {
        message: "그럼 지난달은?",
        previousTurn: {
          question: "이번 달 주문 수는?",
          answer: "이번 달 주문은 총 10건이야.",
        },
      },
      () => undefined,
      new AbortController().signal,
    );

    expect(requests).toEqual([
      { message: "이번 달 주문 수는?" },
      {
        message: "그럼 지난달은?",
        previousTurn: {
          question: "이번 달 주문 수는?",
          answer: "이번 달 주문은 총 10건이야.",
        },
      },
    ]);
  });

  it("직전 질문과 답변이 모두 있는 strict 문맥만 허용한다", () => {
    expect(
      chatRequestSchema.safeParse({
        message: "후속 질문",
        previousTurn: { question: "이전 질문" },
      }).success,
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        message: "후속 질문",
        previousTurn: { question: "이전 질문", answer: "이전 답변", tokenCount: 10 },
      }).success,
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        message: "후속 질문",
        previousTurn: { question: "가".repeat(301), answer: "이전 답변" },
      }).success,
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        message: "후속 질문",
        previousTurn: { question: "이전 질문", answer: "가".repeat(801) },
      }).success,
    ).toBe(false);
  });

  it("먼저 확인된 답과 최종 답의 여러 delta를 같은 자연어 답변으로 전달한다", async () => {
    server.use(http.post("*/api/v1/ai/chats", () => streamResponse(toolEvents())));

    const events = await collect("지난달 주문 수를 알려줘");

    expect(events.map((event) => event.type)).toEqual([
      "started",
      "status",
      "status",
      "status",
      "delta",
      "delta",
      "done",
    ]);
    expect(
      events
        .filter(
          (event): event is Extract<ChatStreamEvent, { type: "delta" }> => event.type === "delta",
        )
        .map((event) => event.data.text)
        .join(""),
    ).toBe("지난달 주문은 총 1,284건이야.");
  });

  it("네트워크 chunk 경계와 heartbeat comment에 영향받지 않는다", async () => {
    const payload = [
      sse("started", { requestId: REQUEST_ID }, "\r\n"),
      ": keep-alive\r\n\r\n",
      ...directEvents().slice(1),
    ].join("");
    const bytes = encoder.encode(payload);
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        streamResponse([bytes.slice(0, 17), bytes.slice(17, 63), bytes.slice(63)]),
      ),
    );

    const events = await collect();

    expect(events.at(-1)?.type).toBe("done");
  });

  it("서버 error 이벤트를 먼저 전달하고 ChatEventError로 종료한다", async () => {
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        streamResponse([
          sse("started", { requestId: REQUEST_ID }),
          sse("error", {
            requestId: REQUEST_ID,
            code: "CHAT_BUSY",
            message: "요청이 많아. 잠시 후 다시 시도해 줘.",
            retryable: true,
            partial: false,
          }),
        ]),
      ),
    );
    const events: ChatStreamEvent[] = [];

    await expect(
      streamAdminChat(
        { message: "질문" },
        (event) => events.push(event),
        new AbortController().signal,
      ),
    ).rejects.toBeInstanceOf(ChatEventError);
    expect(events.map((event) => event.type)).toEqual(["started", "error"]);
  });

  it.each([
    {
      name: "started 이전 status",
      events: [sse("status", { requestId: REQUEST_ID, stage: "ANALYZING" }), ...directEvents()],
    },
    {
      name: "서로 다른 requestId",
      events: [
        sse("started", { requestId: REQUEST_ID }),
        sse("status", { requestId: OTHER_REQUEST_ID, stage: "ANALYZING" }),
      ],
    },
    {
      name: "GENERATING으로 바로 시작",
      events: [
        sse("started", { requestId: REQUEST_ID }),
        sse("status", { requestId: REQUEST_ID, stage: "GENERATING" }),
      ],
    },
    {
      name: "구형 message 이벤트",
      events: [
        sse("started", { requestId: REQUEST_ID }),
        sse("status", { requestId: REQUEST_ID, stage: "ANALYZING" }),
        sse("status", { requestId: REQUEST_ID, stage: "GENERATING" }),
        sse("message", { requestId: REQUEST_ID, text: "구형 응답" }),
      ],
    },
    {
      name: "자연어 답변 없는 done",
      events: [
        sse("started", { requestId: REQUEST_ID }),
        sse("status", { requestId: REQUEST_ID, stage: "ANALYZING" }),
        sse("status", { requestId: REQUEST_ID, stage: "GENERATING" }),
        sse("done", { requestId: REQUEST_ID }),
      ],
    },
  ])("$name 응답을 계약 오류로 거부한다", async ({ events }) => {
    server.use(http.post("*/api/v1/ai/chats", () => streamResponse([events.join("")])));

    await expect(collect()).rejects.toBeInstanceOf(ChatProtocolError);
  });

  it("done 없는 EOF는 전달된 답변을 보존한 채 실패한다", async () => {
    server.use(http.post("*/api/v1/ai/chats", () => streamResponse(directEvents().slice(0, -1))));
    const events: ChatStreamEvent[] = [];

    await expect(
      streamAdminChat(
        { message: "질문" },
        (event) => events.push(event),
        new AbortController().signal,
      ),
    ).rejects.toThrow("완료 이벤트 없이");
    expect(events.some((event) => event.type === "delta")).toBe(true);
  });

  it("terminal 뒤 같은 chunk의 추가 이벤트를 거부한다", async () => {
    server.use(
      http.post("*/api/v1/ai/chats", () =>
        streamResponse([
          [...directEvents(), sse("status", { requestId: REQUEST_ID, stage: "ANALYZING" })].join(
            "",
          ),
        ]),
      ),
    );

    await expect(collect()).rejects.toThrow("종료 이벤트 뒤");
  });

  it("SSE가 아닌 응답은 읽지 않는다", async () => {
    server.use(
      http.post("*/api/v1/ai/chats", () => streamResponse(directEvents(), "application/json")),
    );

    await expect(collect()).rejects.toThrow("SSE 형식");
  });
});

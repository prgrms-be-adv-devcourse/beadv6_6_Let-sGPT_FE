import { apiFetch, apiFetchResponse } from "@/shared/api/http";
import {
  type ChatCapabilitiesResponse,
  type ChatErrorPayload,
  type ChatRequest,
  type ChatStage,
  type ChatStreamEvent,
  chatCapabilitiesResponseSchema,
  chatRequestSchema,
  parseChatStreamEvent,
} from "../model/chat.schema";

export class ChatProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatProtocolError";
  }
}

export class ChatEventError extends Error {
  readonly payload: ChatErrorPayload;

  constructor(payload: ChatErrorPayload) {
    super(payload.message);
    this.name = "ChatEventError";
    this.payload = payload;
  }
}

type RawSseEvent = {
  type: string;
  data: string;
};

function parseSseBlock(block: string): RawSseEvent | null {
  let type = "message";
  const dataLines: string[] = [];

  for (const line of block.split(/\r?\n/)) {
    if (line === "" || line.startsWith(":")) {
      continue;
    }

    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    let value = separator === -1 ? "" : line.slice(separator + 1);
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }

    if (field === "event") {
      type = value;
    } else if (field === "data") {
      dataLines.push(value);
    }
  }

  return dataLines.length > 0 ? { type, data: dataLines.join("\n") } : null;
}

function takeSseBlock(buffer: string): { block: string; rest: string } | null {
  const boundary = /\r?\n\r?\n/.exec(buffer);
  if (!boundary || boundary.index === undefined) {
    return null;
  }
  return {
    block: buffer.slice(0, boundary.index),
    rest: buffer.slice(boundary.index + boundary[0].length),
  };
}

function decodeEvent(raw: RawSseEvent): ChatStreamEvent {
  let value: unknown;
  try {
    value = JSON.parse(raw.data);
  } catch {
    throw new ChatProtocolError(`${raw.type} 이벤트의 JSON 형식이 올바르지 않습니다.`);
  }

  try {
    return parseChatStreamEvent(raw.type, value);
  } catch {
    throw new ChatProtocolError(`${raw.type} 이벤트 데이터가 계약과 일치하지 않습니다.`);
  }
}

function abortReason(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new DOMException("요청이 취소되었습니다.", "AbortError");
}

function readStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  if (signal.aborted) {
    return Promise.reject(abortReason(signal));
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortReason(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    reader
      .read()
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
}

const STAGE_ORDER: Record<ChatStage, number> = {
  ANALYZING: 0,
  CALLING_TOOL: 1,
  GENERATING: 2,
};

class ChatStreamProtocol {
  private requestId: string | null = null;
  private stage: ChatStage | null = null;
  private answerReceived = false;
  private terminal = false;
  private normalCompletion = false;

  get isTerminal(): boolean {
    return this.terminal;
  }

  get isNormallyCompleted(): boolean {
    return this.normalCompletion;
  }

  accept(event: ChatStreamEvent): void {
    if (this.terminal) {
      throw new ChatProtocolError("종료 이벤트 뒤에 추가 이벤트가 도착했습니다.");
    }

    if (this.requestId === null) {
      if (event.type !== "started") {
        throw new ChatProtocolError("응답 시작 이벤트가 가장 먼저 와야 합니다.");
      }
      this.requestId = event.data.requestId;
      return;
    }

    if (event.type === "started") {
      throw new ChatProtocolError("응답 시작 이벤트가 중복되었습니다.");
    }
    if (event.data.requestId !== this.requestId) {
      throw new ChatProtocolError("SSE 이벤트의 요청 ID가 일치하지 않습니다.");
    }

    switch (event.type) {
      case "status":
        this.acceptStatus(event.data.stage);
        return;
      case "delta":
        this.acceptAnswer();
        return;
      case "done":
        if (this.stage !== "GENERATING" || !this.answerReceived) {
          throw new ChatProtocolError("자연어 답변 없이 응답이 완료되었습니다.");
        }
        this.terminal = true;
        this.normalCompletion = true;
        return;
      case "error":
        if (event.data.partial !== this.answerReceived) {
          throw new ChatProtocolError(
            "error.partial이 앞서 전달된 부분 답변 존재 여부와 일치하지 않습니다.",
          );
        }
        this.terminal = true;
        return;
    }
  }

  private acceptStatus(nextStage: ChatStage): void {
    if (this.answerReceived) {
      throw new ChatProtocolError("답변이 시작된 뒤 처리 상태가 변경되었습니다.");
    }
    if (this.stage === null) {
      if (nextStage !== "ANALYZING") {
        throw new ChatProtocolError("첫 처리 상태는 ANALYZING이어야 합니다.");
      }
      this.stage = nextStage;
      return;
    }
    if (STAGE_ORDER[nextStage] <= STAGE_ORDER[this.stage]) {
      throw new ChatProtocolError("처리 상태의 순서가 올바르지 않습니다.");
    }
    if (this.stage === "ANALYZING" && nextStage === "GENERATING") {
      this.stage = nextStage;
      return;
    }
    if (this.stage === "ANALYZING" && nextStage === "CALLING_TOOL") {
      this.stage = nextStage;
      return;
    }
    if (this.stage === "CALLING_TOOL" && nextStage === "GENERATING") {
      this.stage = nextStage;
      return;
    }
    throw new ChatProtocolError("처리 상태의 순서가 올바르지 않습니다.");
  }

  private acceptAnswer(): void {
    if (this.stage !== "GENERATING") {
      throw new ChatProtocolError("답변 생성 상태보다 자연어 답변이 먼저 왔습니다.");
    }
    this.answerReceived = true;
  }
}

export function getChatCapabilities(): Promise<ChatCapabilitiesResponse> {
  return apiFetch("/api/v1/ai/chats/capabilities", chatCapabilitiesResponseSchema);
}

/**
 * 인증이 필요한 POST SSE 응답을 읽는다. `done`만 정상 완료로 인정하고,
 * `error` 또는 terminal 없는 EOF는 이미 받은 자연어 답변을 보존한 채 실패로 알린다.
 */
export async function streamAdminChat(
  request: ChatRequest,
  onEvent: (event: ChatStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const body = chatRequestSchema.parse(request);
  const response = await apiFetchResponse("/api/v1/ai/chats", {
    method: "POST",
    body,
    accept: "text/event-stream",
    signal,
  });

  if (!response.headers.get("Content-Type")?.toLowerCase().includes("text/event-stream")) {
    throw new ChatProtocolError("챗봇 응답이 SSE 형식이 아닙니다.");
  }
  if (!response.body) {
    throw new ChatProtocolError("챗봇 응답 스트림이 비어 있습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const protocol = new ChatStreamProtocol();
  let buffer = "";
  let eventError: ChatEventError | null = null;

  const deliver = (block: string) => {
    const raw = parseSseBlock(block);
    if (!raw) {
      return;
    }

    const event = decodeEvent(raw);
    protocol.accept(event);
    onEvent(event);
    if (event.type === "error") {
      eventError = new ChatEventError(event.data);
    }
  };

  const deliverBufferedBlocks = () => {
    let next = takeSseBlock(buffer);
    while (next) {
      buffer = next.rest;
      deliver(next.block);
      next = takeSseBlock(buffer);
    }
  };

  try {
    while (!protocol.isTerminal) {
      const { done, value } = await readStream(reader, signal);
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      deliverBufferedBlocks();
    }

    // terminal과 같은 네트워크 청크에 섞인 잘못된 후속 이벤트도 검사한다.
    deliverBufferedBlocks();
    if (buffer.trim()) {
      deliver(buffer);
      buffer = "";
    }
    if (!protocol.isTerminal) {
      throw new ChatProtocolError("완료 이벤트 없이 응답이 종료되었습니다.");
    }
    if (eventError) {
      throw eventError;
    }
    if (!protocol.isNormallyCompleted) {
      throw new ChatProtocolError("정상 완료 이벤트 없이 응답이 종료되었습니다.");
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

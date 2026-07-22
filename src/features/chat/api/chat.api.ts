import { apiFetch, apiFetchResponse } from "@/shared/api/http";
import {
  type ChatCapabilitiesResponse,
  type ChatErrorPayload,
  type ChatRequest,
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

  if (dataLines.length === 0) {
    return null;
  }
  return { type, data: dataLines.join("\n") };
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

export function getChatCapabilities(): Promise<ChatCapabilitiesResponse> {
  return apiFetch("/api/v1/ai/chats/capabilities", chatCapabilitiesResponseSchema);
}

/**
 * POST SSE 응답을 읽는다. `done`만 정상 완료로 인정하고, error 이벤트나 done 없는 EOF는
 * 이미 전달한 부분 응답을 보존한 채 호출자에게 실패로 알린다.
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
  let buffer = "";
  let completed = false;

  const deliver = (block: string) => {
    const raw = parseSseBlock(block);
    if (!raw) {
      return;
    }

    const event = decodeEvent(raw);
    onEvent(event);
    if (event.type === "error") {
      throw new ChatEventError(event.data);
    }
    if (event.type === "done") {
      completed = true;
    }
  };

  try {
    while (!completed) {
      const { done, value } = await readStream(reader, signal);
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let next = takeSseBlock(buffer);
      while (next) {
        buffer = next.rest;
        deliver(next.block);
        if (completed) {
          break;
        }
        next = takeSseBlock(buffer);
      }
    }

    if (!completed && buffer.trim()) {
      deliver(buffer);
    }
    if (!completed) {
      throw new ChatProtocolError("완료 이벤트 없이 응답이 종료되었습니다.");
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { streamAdminChat } from "../api/chat.api";
import type { ChatRequest, ChatStreamEvent } from "../model/chat.schema";
import { type ChatViewportLifecycle, useAdminChatSession } from "./useAdminChatSession";

vi.mock("../api/chat.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/chat.api")>();
  return { ...actual, streamAdminChat: vi.fn() };
});

type PendingStream = {
  request: ChatRequest;
  signal: AbortSignal;
  onEvent: (event: ChatStreamEvent) => void;
  resolve: () => void;
};

const REQUEST_ONE = "11111111-1111-4111-8111-111111111111";
const REQUEST_TWO = "22222222-2222-4222-8222-222222222222";

describe("useAdminChatSession", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("취소된 요청의 늦은 이벤트가 새 요청의 상태와 응답을 바꾸지 못한다", async () => {
    const pendingStreams: PendingStream[] = [];
    vi.mocked(streamAdminChat).mockImplementation(
      (request, onEvent, signal) =>
        new Promise<void>((resolve, reject) => {
          pendingStreams.push({ request, signal, onEvent, resolve });
          signal.addEventListener("abort", () => reject(signal.reason), { once: true });
        }),
    );
    const lifecycle: ChatViewportLifecycle = {
      requestStarted: vi.fn(),
      terminalReceived: vi.fn(),
      requestSettled: vi.fn(),
    };
    const viewportLifecycleRef = { current: lifecycle };
    const { result } = renderHook(() => useAdminChatSession(2_000, viewportLifecycleRef));

    act(() => {
      void result.current.runRequest("첫 번째 질문");
    });
    await waitFor(() => expect(pendingStreams).toHaveLength(1));

    act(() => {
      pendingStreams[0]?.onEvent({ type: "started", data: { requestId: REQUEST_ONE } });
      pendingStreams[0]?.onEvent({
        type: "status",
        data: { requestId: REQUEST_ONE, stage: "ANALYZING" },
      });
      pendingStreams[0]?.onEvent({
        type: "status",
        data: { requestId: REQUEST_ONE, stage: "GENERATING" },
      });
      pendingStreams[0]?.onEvent({
        type: "delta",
        data: { requestId: REQUEST_ONE, text: "보존할 부분 응답" },
      });
    });

    act(() => {
      void result.current.runRequest("두 번째 질문");
    });
    await waitFor(() => expect(pendingStreams).toHaveLength(2));
    expect(pendingStreams[0]?.signal.aborted).toBe(true);

    act(() => {
      pendingStreams[0]?.onEvent({
        type: "delta",
        data: { requestId: REQUEST_ONE, text: "무시해야 할 응답" },
      });
      pendingStreams[0]?.onEvent({ type: "done", data: { requestId: REQUEST_ONE } });
    });

    expect(result.current.turns[0]).toMatchObject({
      state: "cancelled",
      answer: "보존할 부분 응답",
    });
    expect(result.current.activeTurn?.prompt).toBe("두 번째 질문");

    await act(async () => {
      pendingStreams[1]?.onEvent({ type: "started", data: { requestId: REQUEST_TWO } });
      pendingStreams[1]?.onEvent({
        type: "status",
        data: { requestId: REQUEST_TWO, stage: "ANALYZING" },
      });
      pendingStreams[1]?.onEvent({
        type: "status",
        data: { requestId: REQUEST_TWO, stage: "GENERATING" },
      });
      pendingStreams[1]?.onEvent({
        type: "delta",
        data: { requestId: REQUEST_TWO, text: "두 번째 응답" },
      });
      pendingStreams[1]?.onEvent({ type: "done", data: { requestId: REQUEST_TWO } });
      pendingStreams[1]?.resolve();
    });

    expect(result.current.turns).toHaveLength(2);
    expect(result.current.turns[0]).toMatchObject({
      state: "cancelled",
      answer: "보존할 부분 응답",
    });
    expect(result.current.turns[1]).toMatchObject({
      state: "completed",
      answer: "두 번째 응답",
    });
    expect(result.current.activeTurnId).toBeNull();
  });
});

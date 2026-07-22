import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { ApiError } from "@/shared/api/http";
import { ChatEventError, ChatProtocolError, streamAdminChat } from "../api/chat.api";
import { useChatCapabilities } from "../api/chat.queries";
import type {
  ChatCapability,
  ChatErrorPayload,
  ChatRequest,
  ChatStreamEvent,
} from "../model/chat.schema";
import { DEFAULT_CHAT_MESSAGE_MAX_LENGTH } from "../model/chat.schema";
import { ChatComposer } from "./ChatComposer";
import { type ChatTurn, ChatTurnView } from "./ChatTurnView";
import { ChatWelcome } from "./ChatWelcome";

const CHAT_MESSAGE_HARD_LIMIT = 10_000;
const CHAT_VISIBLE_TOP = 80;
const CHAT_COMPOSER_GAP = 24;

function requestLayoutFrame(callback: () => void): number {
  return typeof window.requestAnimationFrame === "function"
    ? window.requestAnimationFrame(callback)
    : window.setTimeout(callback, 0);
}

function cancelLayoutFrame(handle: number): void {
  if (typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(handle);
  } else {
    window.clearTimeout(handle);
  }
}

type ChatState = {
  turns: ChatTurn[];
  activeTurnId: string | null;
};

type TerminalViewportSnapshot = {
  id: string;
  turnTop: number;
  revealEnd: boolean;
};

type ChatAction =
  | { type: "start"; turn: ChatTurn }
  | { type: "event"; id: string; event: ChatStreamEvent }
  | { type: "fail"; id: string; error: ChatErrorPayload }
  | { type: "cancel"; id: string }
  | { type: "release"; id: string };

const initialState: ChatState = { turns: [], activeTurnId: null };

function updateTurn(state: ChatState, id: string, update: (turn: ChatTurn) => ChatTurn): ChatState {
  return {
    ...state,
    turns: state.turns.map((turn) => (turn.id === id ? update(turn) : turn)),
  };
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "start":
      return { turns: [...state.turns, action.turn], activeTurnId: action.turn.id };
    case "event":
      return updateTurn(state, action.id, (turn) => {
        if (turn.state !== "running") {
          return turn;
        }
        switch (action.event.type) {
          case "status":
            return {
              ...turn,
              stage: action.event.data.stage,
              route: action.event.data.route ?? turn.route,
            };
          case "message":
          case "delta":
            return { ...turn, answer: turn.answer + action.event.data.text };
          case "done":
            return { ...turn, state: "completed", route: action.event.data.route };
          case "error":
            return { ...turn, state: "failed", error: action.event.data };
        }
      });
    case "fail":
      return updateTurn(state, action.id, (turn) => ({
        ...turn,
        state: "failed",
        error: turn.error ?? action.error,
      }));
    case "cancel":
      return updateTurn(state, action.id, (turn) => ({ ...turn, state: "cancelled" }));
    case "release":
      return state.activeTurnId === action.id ? { ...state, activeTurnId: null } : state;
  }
}

function toFailure(error: unknown, partial: boolean): ChatErrorPayload {
  if (error instanceof ChatEventError) {
    return error.payload;
  }
  if (error instanceof ChatProtocolError) {
    return {
      code: "INCOMPLETE_STREAM",
      message: error.message,
      retryable: true,
      partial,
    };
  }
  if (error instanceof ApiError) {
    return {
      code: error.code ?? `HTTP_${error.status}`,
      message: error.message,
      retryable: error.status === 429 || error.status >= 500,
      partial,
    };
  }
  return {
    code: "UNKNOWN",
    message: error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
    retryable: false,
    partial,
  };
}

function uniqueStarterQuestions(capabilities: ChatCapability[]): string[] {
  const questions = capabilities
    .filter((capability) => capability.availability === "ACTIVE")
    .flatMap((capability) => capability.sampleQuestions);
  return [...new Set(questions)].slice(0, 3);
}

/** 관리자 범용 AI 어시스턴트 — capability 안내와 단일 요청 POST SSE 수명주기. */
export function AdminChatbot() {
  const capabilities = useChatCapabilities();
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [draft, setDraft] = useState("");
  const [alignedTurnId, setAlignedTurnId] = useState<string | null>(null);
  const controllerRef = useRef<{ id: string; controller: AbortController } | null>(null);
  const turnElementsRef = useRef(new Map<string, HTMLElement>());
  const turnEndElementsRef = useRef(new Map<string, HTMLSpanElement>());
  const activeTurnIdRef = useRef<string | null>(null);
  const followActiveAnswerRef = useRef(true);
  const followFrameRef = useRef<number | null>(null);
  const terminalViewportRef = useRef<TerminalViewportSnapshot | null>(null);
  const terminalTimeoutRef = useRef<number | null>(null);

  const capabilityItems = capabilities.data?.capabilities ?? [];
  const starterQuestions = useMemo(
    () => uniqueStarterQuestions(capabilityItems),
    [capabilityItems],
  );
  const maxMessageLength = Math.min(
    capabilities.data?.maxMessageLength ?? DEFAULT_CHAT_MESSAGE_MAX_LENGTH,
    CHAT_MESSAGE_HARD_LIMIT,
  );
  const busy = state.activeTurnId !== null;
  const activeTurn = state.activeTurnId
    ? (state.turns.find((turn) => turn.id === state.activeTurnId) ?? null)
    : null;
  const activeTurnProgress =
    activeTurn?.state === "running"
      ? `${activeTurn.id}:${activeTurn.answer.length}:${activeTurn.stage}`
      : null;
  activeTurnIdRef.current = state.activeTurnId;

  useEffect(
    () => () => {
      controllerRef.current?.controller.abort();
      if (followFrameRef.current !== null) {
        cancelLayoutFrame(followFrameRef.current);
      }
      if (terminalTimeoutRef.current !== null) {
        window.clearTimeout(terminalTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    let previousScrollY = window.scrollY;
    function handleScroll() {
      const currentScrollY = window.scrollY;
      if (currentScrollY < previousScrollY - 4) {
        followActiveAnswerRef.current = false;
      } else if (!followActiveAnswerRef.current) {
        const activeTurnId = activeTurnIdRef.current;
        const answerEnd = activeTurnId
          ? turnEndElementsRef.current.get(activeTurnId)?.getBoundingClientRect()
          : null;
        const composer = document
          .querySelector<HTMLElement>('[data-chat-composer="true"]')
          ?.getBoundingClientRect();
        const visibleBottom = (composer?.top ?? window.innerHeight) - CHAT_COMPOSER_GAP;
        if (answerEnd && answerEnd.top >= CHAT_VISIBLE_TOP && answerEnd.bottom <= visibleBottom) {
          followActiveAnswerRef.current = true;
        }
      }
      previousScrollY = currentScrollY;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const activeTurnId = state.activeTurnId;
    if (!activeTurnId) {
      setAlignedTurnId(null);
      return;
    }
    setAlignedTurnId(null);
    const frame = requestLayoutFrame(() => {
      const turnElement = turnElementsRef.current.get(activeTurnId);
      if (!turnElement) {
        return;
      }
      turnElement.scrollIntoView?.({
        block: "start",
        behavior: "auto",
      });
      setAlignedTurnId(activeTurnId);
    });
    return () => cancelLayoutFrame(frame);
  }, [state.activeTurnId]);

  useEffect(() => {
    if (
      !activeTurn ||
      !activeTurnProgress ||
      alignedTurnId !== activeTurn.id ||
      !followActiveAnswerRef.current
    ) {
      return;
    }
    if (followFrameRef.current !== null) {
      cancelLayoutFrame(followFrameRef.current);
    }
    followFrameRef.current = requestLayoutFrame(() => {
      followFrameRef.current = null;
      const answerEnd = turnEndElementsRef.current.get(activeTurn.id)?.getBoundingClientRect();
      const composerTop =
        document.querySelector<HTMLElement>('[data-chat-composer="true"]')?.getBoundingClientRect()
          .top ?? window.innerHeight;
      if (!answerEnd) {
        return;
      }
      const overflow = answerEnd.bottom - (composerTop - CHAT_COMPOSER_GAP);
      if (composerTop > CHAT_VISIBLE_TOP && answerEnd.bottom > 0 && overflow > 0) {
        window.scrollBy({ top: overflow, behavior: "auto" });
      }
    });
    return () => {
      if (followFrameRef.current !== null) {
        cancelLayoutFrame(followFrameRef.current);
        followFrameRef.current = null;
      }
    };
  }, [activeTurn, activeTurnProgress, alignedTurnId]);

  function stopFollowingActiveAnswer() {
    followActiveAnswerRef.current = false;
    if (followFrameRef.current !== null) {
      cancelLayoutFrame(followFrameRef.current);
      followFrameRef.current = null;
    }
  }

  function captureTerminalViewport(id: string) {
    const turnElement = turnElementsRef.current.get(id);
    if (!turnElement) {
      return;
    }
    terminalViewportRef.current = {
      id,
      turnTop: turnElement.getBoundingClientRect().top,
      revealEnd: followActiveAnswerRef.current,
    };
  }

  function scheduleTerminalViewport(id: string) {
    const snapshot = terminalViewportRef.current;
    if (!snapshot || snapshot.id !== id) {
      return;
    }
    terminalViewportRef.current = null;
    if (terminalTimeoutRef.current !== null) {
      window.clearTimeout(terminalTimeoutRef.current);
    }
    terminalTimeoutRef.current = window.setTimeout(() => {
      terminalTimeoutRef.current = window.setTimeout(() => {
        terminalTimeoutRef.current = null;
        const turnElement = turnElementsRef.current.get(id);
        if (!turnElement) {
          return;
        }

        const turnOffset = turnElement.getBoundingClientRect().top - snapshot.turnTop;
        if (Math.abs(turnOffset) > 1) {
          window.scrollBy({ top: turnOffset, behavior: "auto" });
        }
        if (!snapshot.revealEnd) {
          return;
        }

        const answerEnd = turnEndElementsRef.current.get(id)?.getBoundingClientRect();
        const composerTop =
          document
            .querySelector<HTMLElement>('[data-chat-composer="true"]')
            ?.getBoundingClientRect().top ?? window.innerHeight;
        if (!answerEnd) {
          return;
        }
        const overflow = answerEnd.bottom - (composerTop - CHAT_COMPOSER_GAP);
        if (composerTop > CHAT_VISIBLE_TOP && answerEnd.bottom > 0 && overflow > 0) {
          window.scrollBy({ top: overflow, behavior: "auto" });
        }
      }, 0);
    }, 0);
  }

  async function runRequest(prompt: string) {
    const message = prompt.trim();
    if (!message || message.length > maxMessageLength || controllerRef.current) {
      return;
    }

    const id = `chat-${Date.now()}-${state.turns.length + 1}`;
    const request: ChatRequest = { message };
    const controller = new AbortController();
    let hasPartialResponse = false;
    controllerRef.current = { id, controller };
    followActiveAnswerRef.current = true;
    terminalViewportRef.current = null;
    setDraft("");
    dispatch({
      type: "start",
      turn: {
        id,
        request,
        prompt: message,
        state: "running",
        stage: "CONNECTING",
        route: null,
        answer: "",
        error: null,
      },
    });

    try {
      await streamAdminChat(
        request,
        (event) => {
          if ((event.type === "message" || event.type === "delta") && event.data.text) {
            hasPartialResponse = true;
          }
          if (event.type === "done" || event.type === "error") {
            captureTerminalViewport(id);
            stopFollowingActiveAnswer();
          }
          dispatch({ type: "event", id, event });
        },
        controller.signal,
      );
    } catch (error) {
      if (controller.signal.aborted) {
        dispatch({ type: "cancel", id });
      } else {
        if (!terminalViewportRef.current) {
          captureTerminalViewport(id);
        }
        stopFollowingActiveAnswer();
        dispatch({ type: "fail", id, error: toFailure(error, hasPartialResponse) });
      }
    } finally {
      if (controllerRef.current?.controller === controller) {
        controllerRef.current = null;
      }
      dispatch({ type: "release", id });
      scheduleTerminalViewport(id);
    }
  }

  function cancelActiveRequest() {
    const activeRequest = controllerRef.current;
    if (!activeRequest) {
      return;
    }
    captureTerminalViewport(activeRequest.id);
    stopFollowingActiveAnswer();
    controllerRef.current = null;
    dispatch({ type: "cancel", id: activeRequest.id });
    dispatch({ type: "release", id: activeRequest.id });
    activeRequest.controller.abort(
      new DOMException("사용자가 답변 생성을 중지했습니다.", "AbortError"),
    );
    scheduleTerminalViewport(activeRequest.id);
  }

  const hasConversation = state.turns.length > 0;
  const notice =
    capabilities.data?.notice ??
    "일반 개념 설명과 글쓰기를 지원하며, 각 질문은 독립적으로 처리해요.";

  return (
    <div className="mx-auto flex min-h-[max(34rem,calc(100dvh-5rem))] max-w-3xl flex-col [overflow-anchor:none] lg:min-h-[42rem]">
      {hasConversation ? (
        <section className="flex-1 space-y-10 pb-10" aria-label="AI 어시스턴트 대화">
          {state.turns.map((turn) => (
            <ChatTurnView
              key={turn.id}
              turn={turn}
              busy={busy}
              articleRef={(element) => {
                if (element) {
                  turnElementsRef.current.set(turn.id, element);
                } else {
                  turnElementsRef.current.delete(turn.id);
                }
              }}
              answerEndRef={(element) => {
                if (element) {
                  turnEndElementsRef.current.set(turn.id, element);
                } else {
                  turnEndElementsRef.current.delete(turn.id);
                }
              }}
              onRetry={(failedTurn) => void runRequest(failedTurn.prompt)}
            />
          ))}
        </section>
      ) : (
        <ChatWelcome
          notice={notice}
          capabilities={capabilityItems}
          starterQuestions={starterQuestions}
          loading={capabilities.isPending}
          failed={capabilities.isError}
          busy={busy}
          onRetryCapabilities={() => void capabilities.refetch()}
          onStarterQuestion={(question) => void runRequest(question)}
        />
      )}

      <ChatComposer
        value={draft}
        maxLength={maxMessageLength}
        busy={busy}
        onChange={setDraft}
        onSubmit={() => void runRequest(draft)}
        onCancel={cancelActiveRequest}
      />
    </div>
  );
}

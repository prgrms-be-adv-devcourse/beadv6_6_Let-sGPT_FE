import { type RefObject, useEffect, useReducer, useRef, useState } from "react";

import { ApiError } from "@/shared/api/http";
import { uuid } from "@/shared/lib/id";
import { ChatEventError, ChatProtocolError, streamAdminChat } from "../api/chat.api";
import {
  CHAT_PREVIOUS_ANSWER_MAX_LENGTH,
  CHAT_PREVIOUS_QUESTION_MAX_LENGTH,
  type ChatErrorPayload,
  type ChatRequest,
  type ChatStreamEvent,
} from "../model/chat.schema";
import type { ChatTurn } from "./ChatTurnView";

export type ChatViewportLifecycle = {
  requestStarted: () => void;
  terminalReceived: (turnId: string) => void;
  requestSettled: (turnId: string) => void;
};

type ChatState = {
  turns: ChatTurn[];
  activeTurnId: string | null;
};

type ChatAction =
  | { type: "start"; turn: ChatTurn }
  | { type: "event"; id: string; event: ChatStreamEvent; occurredAt: number }
  | { type: "fail"; id: string; error: ChatErrorPayload; occurredAt: number }
  | { type: "cancel"; id: string; occurredAt: number }
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
          case "started":
            return { ...turn, requestId: action.event.data.requestId };
          case "status":
            return { ...turn, stage: action.event.data.stage };
          case "delta":
            return { ...turn, answer: turn.answer + action.event.data.text };
          case "done":
            return {
              ...turn,
              state: "completed",
              finishedAt: action.occurredAt,
              requestId: action.event.data.requestId,
            };
          case "error":
            return {
              ...turn,
              state: "failed",
              finishedAt: action.occurredAt,
              requestId: action.event.data.requestId,
              error: action.event.data,
            };
        }
      });
    case "fail":
      return updateTurn(state, action.id, (turn) =>
        turn.state === "failed" || turn.state === "cancelled"
          ? turn
          : {
              ...turn,
              state: "failed",
              finishedAt: action.occurredAt,
              error: action.error,
            },
      );
    case "cancel":
      return updateTurn(state, action.id, (turn) =>
        turn.state === "running"
          ? { ...turn, state: "cancelled", finishedAt: action.occurredAt }
          : turn,
      );
    case "release":
      return state.activeTurnId === action.id ? { ...state, activeTurnId: null } : state;
  }
}

function toFailure(error: unknown, partial: boolean, requestId: string): ChatErrorPayload {
  if (error instanceof ChatEventError) {
    return error.payload;
  }
  if (error instanceof ChatProtocolError) {
    return {
      requestId,
      code: "INCOMPLETE_STREAM",
      message: error.message,
      retryable: true,
      partial,
    };
  }
  if (error instanceof ApiError) {
    return {
      requestId,
      code: error.code ?? `HTTP_${error.status}`,
      message: error.message,
      retryable: error.status === 429 || error.status >= 500,
      partial,
    };
  }
  if (error instanceof TypeError || (error instanceof Error && error.name === "NetworkError")) {
    return {
      requestId,
      code: "NETWORK_ERROR",
      message: "네트워크 연결을 확인한 뒤 다시 시도해 줘.",
      retryable: true,
      partial,
    };
  }
  return {
    requestId,
    code: "UNKNOWN",
    message: "요청을 처리하지 못했어. 잠시 후 다시 시도해 줘.",
    retryable: false,
    partial,
  };
}

function truncateUnicode(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  let result = "";
  for (const character of trimmed) {
    if (result.length + character.length > maxLength) {
      break;
    }
    result += character;
  }
  return result.trimEnd();
}

function latestCompletedPreviousTurn(turns: ChatTurn[]): ChatRequest["previousTurn"] {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (turn?.state !== "completed") {
      continue;
    }

    const question = truncateUnicode(turn.prompt, CHAT_PREVIOUS_QUESTION_MAX_LENGTH);
    const answer = truncateUnicode(turn.answer, CHAT_PREVIOUS_ANSWER_MAX_LENGTH);
    if (question && answer) {
      return { question, answer };
    }
  }
  return undefined;
}

export function useAdminChatSession(
  maxMessageLength: number,
  viewportLifecycleRef: RefObject<ChatViewportLifecycle | null>,
) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [draft, setDraft] = useState("");
  const controllerRef = useRef<{ id: string; controller: AbortController } | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.controller.abort();
    },
    [],
  );

  async function runRequest(prompt: string, requestOverride?: ChatRequest) {
    const message = (requestOverride?.message ?? prompt).trim();
    if (!message || message.length > maxMessageLength) {
      return;
    }
    cancelActiveRequest("새 요청으로 이전 답변 생성을 중지했습니다.");

    const id = uuid();
    const startedAt = Date.now();
    const previousTurn = requestOverride ? undefined : latestCompletedPreviousTurn(state.turns);
    const request: ChatRequest =
      requestOverride ??
      ({
        message,
        ...(previousTurn ? { previousTurn } : {}),
      } satisfies ChatRequest);
    const controller = new AbortController();
    let hasPartialResponse = false;
    let serverRequestId = id;
    controllerRef.current = { id, controller };
    viewportLifecycleRef.current?.requestStarted();
    setDraft("");
    dispatch({
      type: "start",
      turn: {
        id,
        request,
        prompt: message,
        state: "running",
        startedAt,
        finishedAt: null,
        stage: "CONNECTING",
        requestId: null,
        answer: "",
        error: null,
      },
    });

    try {
      await streamAdminChat(
        request,
        (event) => {
          if (controllerRef.current?.controller !== controller) {
            return;
          }
          if (event.type === "started") {
            serverRequestId = event.data.requestId;
          }
          if (event.type === "delta" && event.data.text) {
            hasPartialResponse = true;
          }
          if (event.type === "done" || event.type === "error") {
            viewportLifecycleRef.current?.terminalReceived(id);
          }
          dispatch({ type: "event", id, event, occurredAt: Date.now() });
        },
        controller.signal,
      );
    } catch (error) {
      if (controller.signal.aborted) {
        dispatch({ type: "cancel", id, occurredAt: Date.now() });
      } else {
        viewportLifecycleRef.current?.terminalReceived(id);
        dispatch({
          type: "fail",
          id,
          occurredAt: Date.now(),
          error: toFailure(error, hasPartialResponse, serverRequestId),
        });
      }
    } finally {
      if (controllerRef.current?.controller === controller) {
        controllerRef.current = null;
      }
      dispatch({ type: "release", id });
      viewportLifecycleRef.current?.requestSettled(id);
    }
  }

  function cancelActiveRequest(reason = "사용자가 답변 생성을 중지했습니다.") {
    const activeRequest = controllerRef.current;
    if (!activeRequest) {
      return;
    }
    viewportLifecycleRef.current?.terminalReceived(activeRequest.id);
    controllerRef.current = null;
    dispatch({ type: "cancel", id: activeRequest.id, occurredAt: Date.now() });
    dispatch({ type: "release", id: activeRequest.id });
    activeRequest.controller.abort(new DOMException(reason, "AbortError"));
  }

  const activeTurn = state.activeTurnId
    ? (state.turns.find((turn) => turn.id === state.activeTurnId) ?? null)
    : null;
  const activeTurnProgress =
    activeTurn?.state === "running"
      ? [activeTurn.id, activeTurn.answer.length, activeTurn.stage].join(":")
      : null;

  return {
    turns: state.turns,
    activeTurnId: state.activeTurnId,
    activeTurn,
    activeTurnProgress,
    busy: state.activeTurnId !== null,
    draft,
    setDraft,
    runRequest,
    cancelActiveRequest,
  };
}

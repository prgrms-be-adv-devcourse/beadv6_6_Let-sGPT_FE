import { AlertTriangle, Check, LoaderCircle, RotateCcw, Square } from "lucide-react";
import { type Ref, useEffect, useState } from "react";

import { Button } from "@/shared/ui/button";
import type { ChatErrorPayload, ChatRequest, ChatStage } from "../model/chat.schema";

export type ChatTurnState = "running" | "completed" | "failed" | "cancelled";

export type ChatTurn = {
  id: string;
  request: ChatRequest;
  prompt: string;
  state: ChatTurnState;
  startedAt: number;
  finishedAt: number | null;
  stage: ChatStage | "CONNECTING";
  requestId: string | null;
  answer: string;
  error: ChatErrorPayload | null;
};

type ChatTurnViewProps = {
  turn: ChatTurn;
  busy: boolean;
  onRetry: (turn: ChatTurn) => void;
  articleRef?: Ref<HTMLElement>;
  answerEndRef?: Ref<HTMLSpanElement>;
};

const STATUS_LABELS: Record<ChatTurn["stage"], string> = {
  CONNECTING: "AI와 연결하고 있어요",
  ANALYZING: "질문을 이해하고 있어요",
  CALLING_TOOL: "필요한 정보를 확인하고 있어요",
  GENERATING: "답변을 정리하고 있어요",
};

const ELAPSED_TIME_INTERVAL_MS = 1_000;

export function formatPlainAnswer(answer: string): string {
  return answer
    .replace(/\*\*/g, "")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^\s*[*-]\s+/gm, "• ");
}

function formatElapsedTime(durationMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, durationMs) / 1_000);
  if (totalSeconds === 0) {
    return "1초 미만";
  }
  if (totalSeconds < 60) {
    return `${totalSeconds}초`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`;
}

function useElapsedTime(turn: ChatTurn): { label: string; dateTime: string } {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    if (turn.state !== "running") {
      return;
    }
    const timer = window.setInterval(() => setCurrentTime(Date.now()), ELAPSED_TIME_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [turn.state]);

  const durationMs = Math.max(0, (turn.finishedAt ?? currentTime) - turn.startedAt);
  return {
    label: formatElapsedTime(durationMs),
    dateTime: `PT${Math.floor(durationMs / 1_000)}S`,
  };
}

export function ChatTurnView({ turn, busy, onRetry, articleRef, answerEndRef }: ChatTurnViewProps) {
  const running = turn.state === "running";
  const elapsedTime = useElapsedTime(turn);
  const answer = formatPlainAnswer(turn.answer);

  return (
    <article
      ref={articleRef}
      className="scroll-mt-24 space-y-7 border-t pt-10 duration-300 animate-in fade-in-0 slide-in-from-bottom-1 first:border-t-0 first:pt-0 motion-reduce:animate-none"
    >
      <section aria-label="내 질문" className="flex justify-end">
        <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl bg-surface px-4 py-3 text-sm leading-6 [overflow-wrap:anywhere] sm:max-w-2xl sm:px-5">
          {turn.prompt}
        </p>
      </section>

      <section aria-label="AI 답변" aria-busy={running} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <p className="text-xs uppercase tracking-[0.2em]">openAt AI</p>
            {running ? (
              <>
                <LoaderCircle
                  className="size-4 shrink-0 animate-spin text-foreground/75"
                  data-chat-loading-indicator="true"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <time dateTime={elapsedTime.dateTime} className="text-xs tabular-nums">
                  <span className="sr-only">응답 경과 시간 {elapsedTime.label}</span>
                  <span aria-hidden="true">{elapsedTime.label}</span>
                </time>
              </>
            ) : null}
          </div>
          {turn.state === "completed" ? (
            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Check className="size-3.5" aria-hidden="true" />
              <time dateTime={elapsedTime.dateTime} className="tabular-nums">
                <span className="sr-only">응답 소요 시간 {elapsedTime.label}</span>
                <span aria-hidden="true">{elapsedTime.label}</span>
              </time>
            </p>
          ) : null}
        </div>

        {running ? (
          <p className="text-muted-foreground text-sm" role="status" aria-live="polite">
            <span
              key={turn.stage}
              className="inline-block duration-200 animate-in fade-in-0 motion-reduce:animate-none"
            >
              {STATUS_LABELS[turn.stage]}
            </span>
          </p>
        ) : null}

        {answer ? (
          <p
            className="whitespace-pre-wrap break-words text-[15px] leading-7 duration-300 animate-in fade-in-0 [overflow-wrap:anywhere] motion-reduce:animate-none"
            data-chat-streaming-answer={running ? "true" : undefined}
          >
            {answer}
            {running ? (
              <span
                className="ml-0.5 inline-block h-[1em] w-px translate-y-[0.12em] bg-foreground/50 animate-pulse motion-reduce:animate-none"
                data-chat-stream-cursor="true"
                aria-hidden="true"
              />
            ) : null}
          </p>
        ) : null}

        {turn.state === "completed" ? (
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            AI 답변이 완료됐습니다. {elapsedTime.label} 소요.
          </p>
        ) : null}

        {turn.state === "failed" && turn.error ? (
          <div className="space-y-3 border-destructive/30 border-t pt-4" role="alert">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div>
                <p className="text-destructive">{turn.error.message}</p>
                {turn.error.partial && turn.answer ? (
                  <p className="mt-1 text-muted-foreground text-xs">
                    먼저 받은 답변은 남겨뒀지만 끝까지 생성되지는 않았어.
                  </p>
                ) : null}
              </div>
            </div>
            {turn.error.retryable ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onRetry(turn)}
              >
                <RotateCcw aria-hidden="true" />
                다시 시도
              </Button>
            ) : null}
          </div>
        ) : null}

        {turn.state === "cancelled" ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-muted-foreground text-sm"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="flex items-center gap-2">
              <Square className="size-3" aria-hidden="true" />
              답변 생성을 중지했어.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onRetry(turn)}
            >
              <RotateCcw aria-hidden="true" />
              다시 시도
            </Button>
          </div>
        ) : null}

        <span ref={answerEndRef} className="block h-px" aria-hidden="true" />
      </section>
    </article>
  );
}

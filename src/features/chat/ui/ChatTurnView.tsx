import { AlertTriangle, Check, RotateCcw, Square } from "lucide-react";
import type { Ref } from "react";

import { Button } from "@/shared/ui/button";
import type { ChatErrorPayload, ChatRequest, ChatRoute, ChatStage } from "../model/chat.schema";

export type ChatTurnState = "running" | "completed" | "failed" | "cancelled";

export type ChatTurn = {
  id: string;
  request: ChatRequest;
  prompt: string;
  state: ChatTurnState;
  stage: ChatStage | "CONNECTING";
  route: ChatRoute | null;
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
  CONNECTING: "요청을 연결하고 있어요",
  ROUTING: "질문 유형을 확인하고 있어요",
  PLANNING: "답변을 준비하고 있어요",
  QUERYING: "필요한 데이터를 확인하고 있어요",
  RETRIEVING: "관련 문서를 확인하고 있어요",
  CALLING_TOOL: "최신 정보를 확인하고 있어요",
  GENERATING: "답변을 작성하고 있어요",
};

const ROUTE_LABELS: Record<ChatRoute, string> = {
  FAST_METRIC: "고정 지표",
  SEMANTIC_QUERY: "자유 집계",
  KNOWLEDGE_RAG: "내부 문서",
  EXTERNAL_TOOL: "실시간 정보",
  GENERAL_ANSWER: "일반 답변",
  CLARIFICATION: "추가 확인",
  UNSUPPORTED: "지원 범위 안내",
};

export function ChatTurnView({ turn, busy, onRetry, articleRef, answerEndRef }: ChatTurnViewProps) {
  const running = turn.state === "running";

  return (
    <article
      ref={articleRef}
      className="scroll-mt-24 space-y-7 border-t pt-10 first:border-t-0 first:pt-0"
    >
      <section aria-label="내 질문" className="flex justify-end">
        <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl bg-surface px-4 py-3 text-sm leading-6 [overflow-wrap:anywhere] sm:max-w-2xl sm:px-5">
          {turn.prompt}
        </p>
      </section>

      <section aria-label="AI 답변" aria-busy={running} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">openAt AI</p>
          {turn.state === "completed" && turn.route ? (
            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Check className="size-3.5" aria-hidden="true" />
              {ROUTE_LABELS[turn.route]}
            </p>
          ) : null}
        </div>

        {running ? (
          <div
            className="flex items-center gap-2 text-muted-foreground text-sm"
            role="status"
            aria-live="polite"
          >
            <span
              className="size-1.5 rounded-full bg-foreground/60 animate-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span>{STATUS_LABELS[turn.stage]}</span>
          </div>
        ) : null}

        {turn.answer ? (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-7 [overflow-wrap:anywhere]">
            {turn.answer}
          </p>
        ) : null}

        {turn.state === "completed" && turn.route ? (
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            AI 답변이 완료됐습니다. {ROUTE_LABELS[turn.route]}.
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
                    먼저 받은 내용은 남겨두었지만 응답이 완전히 끝나지 않았습니다.
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
              답변 생성을 중지했습니다.
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

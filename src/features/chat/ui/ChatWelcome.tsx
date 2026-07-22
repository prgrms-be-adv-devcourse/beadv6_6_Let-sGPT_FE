import { ArrowUpRight } from "lucide-react";

import { Button } from "@/shared/ui/button";
import type { ChatCapability } from "../model/chat.schema";

type ChatWelcomeProps = {
  notice: string;
  capabilities: ChatCapability[];
  starterQuestions: string[];
  loading: boolean;
  failed: boolean;
  busy: boolean;
  onRetryCapabilities: () => void;
  onStarterQuestion: (question: string) => void;
};

export function ChatWelcome({
  notice,
  capabilities,
  starterQuestions,
  loading,
  failed,
  busy,
  onRetryCapabilities,
  onStarterQuestion,
}: ChatWelcomeProps) {
  const activeLabels = capabilities
    .filter((capability) => capability.availability === "ACTIVE")
    .map((capability) => capability.label);
  const plannedLabels = capabilities
    .filter((capability) => capability.availability === "PLANNED")
    .map((capability) => capability.label);

  return (
    <section className="flex flex-1 flex-col pb-10 sm:pb-14" aria-labelledby="chat-welcome-title">
      <div className="mx-auto max-w-xl text-center">
        <h2 id="chat-welcome-title" className="text-3xl tracking-tight sm:text-4xl">
          무엇을 도와드릴까요?
        </h2>
        <p className="mt-4 text-muted-foreground text-sm leading-6">{notice}</p>
      </div>

      {loading ? (
        <p className="mt-10 text-center text-muted-foreground text-xs" role="status">
          사용할 수 있는 기능을 확인하고 있어요.
        </p>
      ) : null}

      {failed ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center" role="alert">
          <p className="text-muted-foreground text-sm">
            기능 안내를 불러오지 못했지만 직접 질문할 수 있습니다.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onRetryCapabilities}>
            다시 불러오기
          </Button>
        </div>
      ) : null}

      {starterQuestions.length > 0 ? (
        <ul className="mt-10 grid border-y sm:grid-cols-3 sm:divide-x" aria-label="추천 질문">
          {starterQuestions.map((question, index) => (
            <li key={question} className="border-b last:border-b-0 sm:border-b-0">
              <button
                type="button"
                disabled={busy}
                onClick={() => onStarterQuestion(question)}
                className="group flex h-full w-full flex-col justify-between gap-7 px-4 py-5 text-left transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex w-full items-center justify-between text-muted-foreground text-xs tabular-nums">
                  0{index + 1}
                  <ArrowUpRight
                    className="size-3.5 transition-colors group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-sm leading-6">{question}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {capabilities.length > 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center text-xs sm:flex-row sm:gap-5">
          {activeLabels.length > 0 ? (
            <p>
              <span className="text-muted-foreground">현재 지원</span>
              <span className="ml-2">{activeLabels.join(" · ")}</span>
            </p>
          ) : null}
          {plannedLabels.length > 0 ? (
            <p className="text-muted-foreground">연결 예정 · {plannedLabels.join(" · ")}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

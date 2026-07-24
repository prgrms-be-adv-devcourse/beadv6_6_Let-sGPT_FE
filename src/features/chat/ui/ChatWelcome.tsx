import { ArrowUpRight } from "lucide-react";

type ChatWelcomeProps = {
  notice: string;
  starterQuestions: string[];
  loading: boolean;
  busy: boolean;
  onStarterQuestion: (question: string) => void;
};

export function ChatWelcome({
  notice,
  starterQuestions,
  loading,
  busy,
  onStarterQuestion,
}: ChatWelcomeProps) {
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
          질문 예시를 준비하고 있어요.
        </p>
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
                <span
                  className="flex w-full items-center justify-between text-muted-foreground text-xs tabular-nums"
                  aria-hidden="true"
                >
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
    </section>
  );
}

import { useMemo, useRef } from "react";

import { useChatCapabilities } from "../api/chat.queries";
import type { ChatCapability } from "../model/chat.schema";
import { DEFAULT_CHAT_MESSAGE_MAX_LENGTH } from "../model/chat.schema";
import { ChatComposer } from "./ChatComposer";
import { ChatTurnView } from "./ChatTurnView";
import { ChatWelcome } from "./ChatWelcome";
import { type ChatViewportLifecycle, useAdminChatSession } from "./useAdminChatSession";
import { useChatViewport } from "./useChatViewport";

function uniqueStarterQuestions(capabilities: ChatCapability[]): string[] {
  const activeQuestions = capabilities
    .filter((capability) => capability.availability === "ACTIVE")
    .map((capability) =>
      capability.sampleQuestions.filter((question) => !question.includes("...")),
    );
  const questions: string[] = [];
  const seen = new Set<string>();
  const maximumDepth = Math.max(0, ...activeQuestions.map((items) => items.length));

  for (let index = 0; index < maximumDepth && questions.length < 3; index += 1) {
    for (const items of activeQuestions) {
      const question = items[index];
      if (question && !seen.has(question)) {
        seen.add(question);
        questions.push(question);
        if (questions.length === 3) {
          break;
        }
      }
    }
  }
  return questions;
}

/** 관리자 범용 AI 어시스턴트의 capability 안내와 대화 화면을 조합한다. */
export function AdminChatbot() {
  const capabilities = useChatCapabilities();
  const capabilityItems = capabilities.data?.capabilities ?? [];
  const starterQuestions = useMemo(
    () => uniqueStarterQuestions(capabilityItems),
    [capabilityItems],
  );
  const maxMessageLength = Math.min(
    capabilities.data?.maxMessageLength ?? DEFAULT_CHAT_MESSAGE_MAX_LENGTH,
    DEFAULT_CHAT_MESSAGE_MAX_LENGTH,
  );

  const viewportLifecycleRef = useRef<ChatViewportLifecycle | null>(null);
  const session = useAdminChatSession(maxMessageLength, viewportLifecycleRef);
  const viewport = useChatViewport({
    activeTurnId: session.activeTurnId,
    activeTurn: session.activeTurn,
    activeTurnProgress: session.activeTurnProgress,
  });
  viewportLifecycleRef.current = viewport.lifecycle;

  const hasConversation = session.turns.length > 0;
  const notice =
    capabilities.data?.notice ??
    "관리자 업무 조회와 일반 질문을 지원하며 각 질문은 독립적으로 처리해요.";

  return (
    <div className="mx-auto flex min-h-[max(34rem,calc(100dvh-5rem))] max-w-3xl flex-col [overflow-anchor:none] lg:min-h-[42rem]">
      {hasConversation ? (
        <section className="flex-1 space-y-10 pb-10" aria-label="AI 어시스턴트 대화">
          {session.turns.map((turn) => (
            <ChatTurnView
              key={turn.id}
              turn={turn}
              busy={session.busy}
              articleRef={(element) => viewport.articleRef(turn.id, element)}
              answerEndRef={(element) => viewport.answerEndRef(turn.id, element)}
              onRetry={(failedTurn) =>
                void session.runRequest(failedTurn.prompt, failedTurn.request)
              }
            />
          ))}
        </section>
      ) : (
        <ChatWelcome
          notice={notice}
          starterQuestions={starterQuestions}
          loading={capabilities.isPending}
          busy={session.busy}
          onStarterQuestion={(question) => void session.runRequest(question)}
        />
      )}

      <ChatComposer
        value={session.draft}
        maxLength={maxMessageLength}
        busy={session.busy}
        onChange={session.setDraft}
        onSubmit={() => void session.runRequest(session.draft)}
        onCancel={session.cancelActiveRequest}
      />
    </div>
  );
}

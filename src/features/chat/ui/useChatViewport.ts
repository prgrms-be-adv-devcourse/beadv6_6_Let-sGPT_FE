import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ChatTurn } from "./ChatTurnView";
import type { ChatViewportLifecycle } from "./useAdminChatSession";

const CHAT_VISIBLE_TOP = 80;
const CHAT_COMPOSER_GAP = 24;

type TerminalViewportSnapshot = {
  id: string;
  turnTop: number;
  revealEnd: boolean;
};

type ChatViewportState = {
  activeTurnId: string | null;
  activeTurn: ChatTurn | null;
  activeTurnProgress: string | null;
};

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

function followScrollBehavior(): ScrollBehavior {
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reducedMotion ? "auto" : "smooth";
}

export function useChatViewport({
  activeTurnId,
  activeTurn,
  activeTurnProgress,
}: ChatViewportState) {
  const [alignedTurnId, setAlignedTurnId] = useState<string | null>(null);
  const turnElementsRef = useRef(new Map<string, HTMLElement>());
  const turnEndElementsRef = useRef(new Map<string, HTMLSpanElement>());
  const activeTurnIdRef = useRef<string | null>(null);
  const followActiveAnswerRef = useRef(true);
  const followFrameRef = useRef<number | null>(null);
  const terminalViewportRef = useRef<TerminalViewportSnapshot | null>(null);
  const terminalTimeoutRef = useRef<number | null>(null);
  activeTurnIdRef.current = activeTurnId;

  useEffect(
    () => () => {
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
        const currentTurnId = activeTurnIdRef.current;
        const answerEnd = currentTurnId
          ? turnEndElementsRef.current.get(currentTurnId)?.getBoundingClientRect()
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
      turnElement.scrollIntoView?.({ block: "start", behavior: followScrollBehavior() });
      setAlignedTurnId(activeTurnId);
    });
    return () => cancelLayoutFrame(frame);
  }, [activeTurnId]);

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
        window.scrollBy({ top: overflow, behavior: followScrollBehavior() });
      }
    });
    return () => {
      if (followFrameRef.current !== null) {
        cancelLayoutFrame(followFrameRef.current);
        followFrameRef.current = null;
      }
    };
  }, [activeTurn, activeTurnProgress, alignedTurnId]);

  const stopFollowingActiveAnswer = useCallback(() => {
    followActiveAnswerRef.current = false;
    if (followFrameRef.current !== null) {
      cancelLayoutFrame(followFrameRef.current);
      followFrameRef.current = null;
    }
  }, []);

  const terminalReceived = useCallback(
    (id: string) => {
      if (terminalViewportRef.current?.id !== id) {
        const turnElement = turnElementsRef.current.get(id);
        if (turnElement) {
          terminalViewportRef.current = {
            id,
            turnTop: turnElement.getBoundingClientRect().top,
            revealEnd: followActiveAnswerRef.current,
          };
        }
      }
      stopFollowingActiveAnswer();
    },
    [stopFollowingActiveAnswer],
  );

  const requestSettled = useCallback((id: string) => {
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
          window.scrollBy({ top: turnOffset, behavior: followScrollBehavior() });
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
          window.scrollBy({ top: overflow, behavior: followScrollBehavior() });
        }
      }, 0);
    }, 0);
  }, []);

  const lifecycle = useMemo<ChatViewportLifecycle>(
    () => ({
      requestStarted: () => {
        followActiveAnswerRef.current = true;
        terminalViewportRef.current = null;
      },
      terminalReceived,
      requestSettled,
    }),
    [requestSettled, terminalReceived],
  );

  return {
    lifecycle,
    articleRef: (turnId: string, element: HTMLElement | null) => {
      if (element) {
        turnElementsRef.current.set(turnId, element);
      } else {
        turnElementsRef.current.delete(turnId);
      }
    },
    answerEndRef: (turnId: string, element: HTMLSpanElement | null) => {
      if (element) {
        turnEndElementsRef.current.set(turnId, element);
      } else {
        turnEndElementsRef.current.delete(turnId);
      }
    },
  };
}

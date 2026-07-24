import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type ChatTurn, ChatTurnView, formatPlainAnswer } from "./ChatTurnView";

const STARTED_AT = Date.parse("2026-07-23T10:00:00+09:00");

function turn(overrides: Partial<ChatTurn> = {}): ChatTurn {
  return {
    id: "turn-1",
    request: { message: "지난달 주문 수 알려줘" },
    prompt: "지난달 주문 수 알려줘",
    state: "running",
    startedAt: STARTED_AT,
    finishedAt: null,
    stage: "ANALYZING",
    requestId: null,
    answer: "",
    error: null,
    ...overrides,
  };
}

describe("ChatTurnView", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("OPENAT AI 오른쪽에서 실제 스피너와 경과 시간을 갱신한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(STARTED_AT);
    render(<ChatTurnView turn={turn()} busy onRetry={() => undefined} />);

    const elapsed = screen.getByText("응답 경과 시간 1초 미만").closest("time");
    const heading = screen.getByText("openAt AI").parentElement;
    const spinner = heading?.querySelector('[data-chat-loading-indicator="true"]');

    expect(spinner).toHaveClass("animate-spin");
    expect(heading?.children[1]).toBe(spinner);
    expect(heading?.children[2]).toBe(elapsed);
    expect(screen.getByRole("status")).toHaveTextContent("질문을 이해하고 있어요");

    act(() => vi.advanceTimersByTime(65_000));

    expect(screen.getByText("응답 경과 시간 1분 5초").closest("time")).toHaveAttribute(
      "datetime",
      "PT65S",
    );
  });

  it("완료 뒤에는 총 소요 시간만 남기고 증가시키지 않는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(STARTED_AT + 10_000);
    const completed = turn({
      state: "completed",
      finishedAt: STARTED_AT + 3_450,
      answer: "지난달 주문은 총 120건이야.",
    });
    const { rerender } = render(
      <ChatTurnView turn={completed} busy={false} onRetry={() => undefined} />,
    );

    expect(screen.getByText("응답 소요 시간 3초").closest("time")).toHaveTextContent("3초");
    expect(screen.getByText("AI 답변이 완료됐습니다. 3초 소요.")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000));
    rerender(<ChatTurnView turn={completed} busy={false} onRetry={() => undefined} />);

    expect(screen.getByText("응답 소요 시간 3초").closest("time")).toHaveTextContent("3초");
  });

  it("스트리밍 답변에 커서를 표시하고 완료되면 제거한다", () => {
    const streaming = turn({
      stage: "GENERATING",
      answer: "첫 번째 답변 조각",
    });
    const { rerender } = render(<ChatTurnView turn={streaming} busy onRetry={() => undefined} />);

    const answer = screen.getByText("첫 번째 답변 조각").closest("p");
    expect(answer).toHaveClass("animate-in", "fade-in-0", "motion-reduce:animate-none");
    expect(answer?.querySelector('[data-chat-stream-cursor="true"]')).toHaveClass(
      "animate-pulse",
      "motion-reduce:animate-none",
    );

    rerender(
      <ChatTurnView
        turn={{ ...streaming, state: "completed", finishedAt: STARTED_AT + 2_000 }}
        busy={false}
        onRetry={() => undefined}
      />,
    );

    expect(document.querySelector('[data-chat-stream-cursor="true"]')).not.toBeInTheDocument();
  });

  it("모델의 흔한 Markdown 장식을 일반 텍스트로 정리한다", () => {
    expect(formatPlainAnswer("**주문 현황**\n* `COMPLETED`: 3건\n- FAILED: 2건")).toBe(
      "주문 현황\n• COMPLETED: 3건\n• FAILED: 2건",
    );
  });
});

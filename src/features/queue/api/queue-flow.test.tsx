import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { getQueueStatus } from "./queue.api";
import { useDecideQueue, useEnterQueue } from "./queue.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("대기열 플로우 (MSW 상태저장 + Zod 경계)", () => {
  it("정적 hot-drop 목록이 없어졌으므로 어떤 dropId 든 동일하게 대기열을 거친다", async () => {
    const { result } = renderHook(() => useEnterQueue(), { wrapper });

    const status = await act(() => result.current.mutateAsync({ dropId: "d2", quantity: 1 }));
    expect(status.status).toBe("WAITING");
    expect(status.rank).toBe(2);
    expect(status.totalWaiting).toBe(3);
  });

  it("진입 → 폴링으로 순번이 줄어 READY 에 도달한다", async () => {
    const { result } = renderHook(() => useEnterQueue(), { wrapper });

    let status = await act(() => result.current.mutateAsync({ dropId: "d1", quantity: 1 }));
    expect(status.status).toBe("WAITING");
    expect(status.rank).toBe(2);
    expect(status.totalWaiting).toBe(3);

    // 상태 폴링(useQueueStatus 가 내부적으로 호출하는 것과 동일한 API)을 직접 반복 호출해
    // 실제 setInterval 시간을 기다리지 않고도 상태 전이를 결정적으로 검증한다.
    status = await getQueueStatus("d1");
    expect(status.rank).toBe(1);
    status = await getQueueStatus("d1");
    expect(status.rank).toBe(0);
    status = await getQueueStatus("d1");
    expect(status.status).toBe("READY");
    expect(status.quantity).toBe(1);
  });

  it("수량 3개 이상은 중간에 DECISION_REQUIRED 를 거치고, WAIT 응답 후 READY 로 이어진다", async () => {
    const enter = renderHook(() => useEnterQueue(), { wrapper });
    await act(() => enter.result.current.mutateAsync({ dropId: "d1", quantity: 3 }));

    await getQueueStatus("d1"); // rank 2 → 1
    await getQueueStatus("d1"); // rank 1 → 0
    const decisionStatus = await getQueueStatus("d1"); // rank 0 → DECISION_REQUIRED
    expect(decisionStatus.status).toBe("DECISION_REQUIRED");
    expect(decisionStatus.grantableNow).toBe(2);
    expect(decisionStatus.optimisticMax).toBe(3);
    // grantableNow>0 이므로 서버가 WAIT/PARTIAL/GIVE_UP 전부 제시하고, 무응답 이탈 처리
    // 마감 시각(카운트다운 기준점)도 함께 내려온다.
    expect(decisionStatus.availableChoices).toEqual(["WAIT", "PARTIAL", "GIVE_UP"]);
    expect(decisionStatus.decisionDeadlineEpochMs).toBeGreaterThan(Date.now());

    const decide = renderHook(() => useDecideQueue(), { wrapper });
    const waited = await act(() =>
      decide.result.current.mutateAsync({ dropId: "d1", choice: "WAIT" }),
    );
    expect(waited.status).toBe("WAITING");

    const finalStatus = await getQueueStatus("d1");
    expect(finalStatus.status).toBe("READY");
    expect(finalStatus.quantity).toBe(3);
  });

  it("수량 5개 이상은 지금 당장 0개라 PARTIAL이 선택지에서 빠지고 WAIT/GIVE_UP만 제시된다", async () => {
    const enter = renderHook(() => useEnterQueue(), { wrapper });
    await act(() => enter.result.current.mutateAsync({ dropId: "d1", quantity: 5 }));

    await getQueueStatus("d1"); // rank 2 → 1
    await getQueueStatus("d1"); // rank 1 → 0
    const decisionStatus = await getQueueStatus("d1"); // rank 0 → DECISION_REQUIRED

    expect(decisionStatus.status).toBe("DECISION_REQUIRED");
    expect(decisionStatus.grantableNow).toBe(0);
    // "0개 부분구매"라는 무의미한 선택지를 서버가 아예 걸러서 내려준다(#4 무한 재질의 루프 차단).
    expect(decisionStatus.availableChoices).toEqual(["WAIT", "GIVE_UP"]);
  });

  it("수량 6개 이상은 기다려도 지금보다 더 못 받아(optimisticMax===grantableNow) WAIT이 빠지고 PARTIAL/GIVE_UP만 제시된다", async () => {
    const enter = renderHook(() => useEnterQueue(), { wrapper });
    await act(() => enter.result.current.mutateAsync({ dropId: "d1", quantity: 6 }));

    await getQueueStatus("d1"); // rank 2 → 1
    await getQueueStatus("d1"); // rank 1 → 0
    const decisionStatus = await getQueueStatus("d1"); // rank 0 → DECISION_REQUIRED

    expect(decisionStatus.status).toBe("DECISION_REQUIRED");
    expect(decisionStatus.grantableNow).toBe(2);
    expect(decisionStatus.optimisticMax).toBe(2);
    // optimisticMax === grantableNow → 기다리는 게 수학적으로 무의미하므로 서버가 WAIT을
    // 아예 걸러서 내려준다(2026-07-21 BE 정정 재현).
    expect(decisionStatus.availableChoices).toEqual(["PARTIAL", "GIVE_UP"]);
  });

  it("DECISION_REQUIRED 에서 PARTIAL 을 선택하면 즉시 축소된 수량으로 READY 된다", async () => {
    const enter = renderHook(() => useEnterQueue(), { wrapper });
    await act(() => enter.result.current.mutateAsync({ dropId: "d1", quantity: 5 }));
    await getQueueStatus("d1");
    await getQueueStatus("d1");
    await getQueueStatus("d1"); // DECISION_REQUIRED

    const decide = renderHook(() => useDecideQueue(), { wrapper });
    const partial = await act(() =>
      decide.result.current.mutateAsync({ dropId: "d1", choice: "PARTIAL" }),
    );
    expect(partial.status).toBe("READY");
    expect(partial.quantity).toBe(2);
  });

  it("GIVE_UP 을 선택하면 대기열에서 즉시 나간다", async () => {
    const enter = renderHook(() => useEnterQueue(), { wrapper });
    await act(() => enter.result.current.mutateAsync({ dropId: "d1", quantity: 1 }));

    const decide = renderHook(() => useDecideQueue(), { wrapper });
    const left = await act(() =>
      decide.result.current.mutateAsync({ dropId: "d1", choice: "GIVE_UP" }),
    );
    expect(left.status).toBe("NOT_IN_QUEUE");

    const status = await getQueueStatus("d1");
    expect(status.status).toBe("NOT_IN_QUEUE");
  });
});

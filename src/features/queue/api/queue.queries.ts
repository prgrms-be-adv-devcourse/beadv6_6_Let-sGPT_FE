import { useMutation, useQuery } from "@tanstack/react-query";

import { type DecisionChoice, QUEUE_TERMINAL_STATUSES } from "../model/queue.schema";
import { decideQueue, enterQueue, getQueueStatus } from "./queue.api";

/** 대기열 진입 — 성공 응답의 status 로 즉시 입장(READY)/대기(WAITING 등)를 판정한다. */
export function useEnterQueue() {
  return useMutation({
    mutationFn: (input: { dropId: string; quantity: number }) =>
      enterQueue(input.dropId, input.quantity),
  });
}

/**
 * 대기열 상태 폴링. 서버가 응답에 실어준 `pollIntervalMs` 로 주기를 스스로 조정하고,
 * 종결 상태(READY/SOLD_OUT/NOT_IN_QUEUE)에 도달하면 자동으로 멈춘다.
 */
export function useQueueStatus(dropId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["queue", "status", dropId] as const,
    queryFn: () => getQueueStatus(dropId),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || QUEUE_TERMINAL_STATUSES.includes(data.status)) {
        return false;
      }
      return data.pollIntervalMs;
    },
    // 브라우저 탭이 백그라운드여도 순번을 계속 확인 — 다른 탭에서 결정 타이밍을 놓치지 않게.
    refetchIntervalInBackground: true,
  });
}

/** DECISION_REQUIRED 응답(WAIT/PARTIAL/GIVE_UP) — 결과 상태를 즉시 반영. */
export function useDecideQueue() {
  return useMutation({
    mutationFn: (input: { dropId: string; choice: DecisionChoice }) =>
      decideQueue(input.dropId, input.choice),
  });
}

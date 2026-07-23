import { z } from "zod";

/**
 * 대기열 진입 통제 판정 결과(BE `QueueStatus`와 1:1 대응).
 * - READY: 입장권 발급 완료 — 즉시 주문 가능.
 * - WAITING: 대기 중(순번 보유).
 * - NOT_IN_QUEUE: 대기열에 없음(포기/이탈/미진입).
 * - SOLD_OUT: 대기 중 드롭이 마감되어 더 이상 입장 불가.
 * - DECISION_REQUIRED: 요청 수량을 지금 당장 다 못 받는 상황 — WAIT/PARTIAL/GIVE_UP 선택 필요.
 */
export const queueStatusSchema = z.enum([
  "READY",
  "WAITING",
  "NOT_IN_QUEUE",
  "SOLD_OUT",
  "DECISION_REQUIRED",
]);
export type QueueStatusValue = z.infer<typeof queueStatusSchema>;

/** DECISION_REQUIRED 상태에 대한 사용자 응답. */
export const decisionChoiceSchema = z.enum(["WAIT", "PARTIAL", "GIVE_UP"]);
export type DecisionChoice = z.infer<typeof decisionChoiceSchema>;

/**
 * `/api/v1/queues/{dropId}/entry|status|decision` 공통 응답(BE `QueueStatusResponse`).
 * rank/totalWaiting/quantity/grantableNow/optimisticMax/soldOutReason 는 상태에 따라
 * 없을 수 있어 nullish.
 */
export const queueStatusResponseSchema = z.object({
  status: queueStatusSchema,
  rank: z.number().nullish(),
  totalWaiting: z.number().nullish(),
  quantity: z.number().nullish(),
  grantableNow: z.number().nullish(),
  optimisticMax: z.number().nullish(),
  pollIntervalMs: z.number(),
  /** status === "SOLD_OUT" 일 때만 값이 있음 — "CLOSED"(마감 시각 경과) 또는
   * "STOCK_EXHAUSTED"(확정 재고 소진)로 정확한 문구를 분기하는 데 쓴다. */
  soldOutReason: z.string().nullish(),
  /**
   * status === "DECISION_REQUIRED" 일 때만 값이 있음 — BE 가 권위 있게 내려주는 선택지
   * 목록. FE 는 이 목록에 있는 버튼만 그려야 한다(예: grantableNow 가 0 이면 PARTIAL 이
   * 빠져서 온다 — "0개 부분구매"라는 무의미한 선택지를 클라이언트가 자체 추론으로
   * 만들어내지 않기 위함). 구버전 BE 호환을 위해 nullish — 없으면 호출부가 폴백한다.
   */
  availableChoices: z.array(decisionChoiceSchema).nullish(),
  /**
   * status === "DECISION_REQUIRED" 이고 무응답 타임아웃 대상일 때만 값이 있음 — 이
   * 시각(epoch ms)까지 응답하지 않으면 BE 가 대기열에서 제거한다(엄격한 FIFO 에서 맨 앞
   * 사람의 미결정은 전체 대기열 정지이므로). WAIT 을 이미 확정한 사람의 재질의(SHORTFALL)
   * 에는 없음(제거 대상이 아니라서) — null 이면 카운트다운을 보여주지 않는다.
   */
  decisionDeadlineEpochMs: z.number().nullish(),
});
export type QueueStatusResponse = z.infer<typeof queueStatusResponseSchema>;

/** 폴링을 멈춰야 하는 종결 상태(READY 는 입장권 발급 완료, SOLD_OUT/NOT_IN_QUEUE 는 더 이상 가망 없음). */
export const QUEUE_TERMINAL_STATUSES: readonly QueueStatusValue[] = [
  "READY",
  "SOLD_OUT",
  "NOT_IN_QUEUE",
];

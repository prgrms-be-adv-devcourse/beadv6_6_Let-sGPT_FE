import { apiFetch } from "@/shared/api/http";
import {
  type DecisionChoice,
  type QueueStatusResponse,
  queueStatusResponseSchema,
} from "../model/queue.schema";

/**
 * 대기열 진입(POST /entry). 정적 hot-drop 목록은 없다 — 모든 dropId 가 균일하게 이 진입
 * 통제를 거친다(BE 는 이제 유량 제어가 아니라 진입 통제 방식). 경쟁이 없으면 BE 가 대기열에
 * 넣지 않고 즉시 READY 를 돌려주는 fast path 가 있어, 실제로 대기 UI 가 보이는 건 진짜 경쟁이
 * 있는 드롭뿐이다 — 그래서 호출부(주문 버튼)는 모든 주문에 이 엔드포인트를 먼저 호출하고,
 * 반환된 status 에 따라 즉시 주문 생성으로 넘어가거나(READY) 대기열 모달을 띄운다.
 *
 * 수량 상한 초과(BE `QUEUE_QUANTITY_LIMIT_EXCEEDED`, 400)는 BE 가 서버 강제하는 안전망(전역
 * 상한 + 드롭별 1인 구매 한도)이라 정상 UI 흐름에서는 보통 안 보이지만, 호출부가 `ApiError`로
 * 잡아 메시지를 그대로 보여준다(별도 코드 분기 불필요 — 메시지 자체가 구체적).
 */
export function enterQueue(dropId: string, quantity: number): Promise<QueueStatusResponse> {
  return apiFetch(`/api/v1/queues/${dropId}/entry`, queueStatusResponseSchema, {
    method: "POST",
    body: { quantity },
  });
}

/** 대기열 상태 폴링(GET /status). */
export function getQueueStatus(dropId: string): Promise<QueueStatusResponse> {
  return apiFetch(`/api/v1/queues/${dropId}/status`, queueStatusResponseSchema);
}

/** DECISION_REQUIRED 응답(POST /decision) — 결과 상태를 즉시 반환. */
export function decideQueue(dropId: string, choice: DecisionChoice): Promise<QueueStatusResponse> {
  return apiFetch(`/api/v1/queues/${dropId}/decision`, queueStatusResponseSchema, {
    method: "POST",
    body: { choice },
  });
}

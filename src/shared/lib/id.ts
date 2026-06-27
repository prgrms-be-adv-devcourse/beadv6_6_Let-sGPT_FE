/** 멱등키 생성(주문/결제/환불/충전). BE 의 Idempotency-Key 헤더·body idempotencyKey 에 사용. */
export function newIdempotencyKey(prefix = "idem"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

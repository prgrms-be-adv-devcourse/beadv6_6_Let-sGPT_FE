/**
 * UUID v4 생성. crypto.randomUUID 는 보안 컨텍스트(https / localhost)에서만 제공되므로,
 * IP + http 접근 시엔 사용 불가 → getRandomValues 또는 Math.random 폴백 사용.
 */
export function uuid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // RFC 4122 version/variant 비트 설정
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}

/** 멱등키 생성(주문/결제/환불/충전). BE 의 Idempotency-Key 헤더·body idempotencyKey 에 사용. */
export function newIdempotencyKey(prefix = "idem"): string {
  return `${prefix}-${uuid()}`;
}

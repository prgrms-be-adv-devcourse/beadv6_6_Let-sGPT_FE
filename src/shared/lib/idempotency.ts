import { uuid } from "./id";

export function getOrCreatePaymentKey(orderId: string): string {
  const k = `idem:pay:${orderId}`;
  const hit = sessionStorage.getItem(k);
  if (hit) return hit;
  const key = `pay-${uuid()}`;
  sessionStorage.setItem(k, key);
  return key;
}

export function clearPaymentKey(orderId: string): void {
  sessionStorage.removeItem(`idem:pay:${orderId}`);
}

/** 충전 버튼 클릭 시점 — chargeId 미확정. pending 키가 이미 있으면 재사용(재클릭 보호). */
export function getOrCreatePendingChargeKey(): string {
  const hit = sessionStorage.getItem("idem:charge:pending");
  if (hit) return hit;
  const key = `charge-${uuid()}`;
  sessionStorage.setItem("idem:charge:pending", key);
  return key;
}

export function clearPendingChargeKey(): void {
  sessionStorage.removeItem("idem:charge:pending");
}

/** POST /wallet/charge 응답으로 chargeId 확정 후 pending → chargeId 슬롯으로 이전. */
export function persistChargeKey(chargeId: string): void {
  const key = sessionStorage.getItem("idem:charge:pending") ?? `charge-${uuid()}`;
  sessionStorage.setItem(`idem:charge:${chargeId}`, key);
  sessionStorage.removeItem("idem:charge:pending");
}

export function getChargeKey(chargeId: string): string {
  return sessionStorage.getItem(`idem:charge:${chargeId}`) ?? `charge-${uuid()}`;
}

export function clearChargeKey(chargeId: string): void {
  sessionStorage.removeItem(`idem:charge:${chargeId}`);
}

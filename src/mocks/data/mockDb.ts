import type { Order } from "@/features/order/model/order.schema";
import type { RefundResponse } from "@/features/payment/model/payment.schema";

export type StoredPayment = {
  paymentId: string;
  orderId: string;
  amount: number;
  method: "WALLET" | "PG";
  status: "PAYMENT_PENDING" | "APPROVED" | "FAILED";
  paymentKey: string | null;
};

export type StoredCharge = {
  chargeId: string;
  amount: number;
  method: "MOCK" | "PG";
  status: "PENDING" | "APPROVED" | "FAILED";
};

export type MockQueueEntry = {
  quantity: number;
  /** 0-based 순번. WAITING 폴링마다 감소하다 0 아래로 내려가면 결정/입장 단계로 넘어간다. */
  rank: number;
  totalWaiting: number;
  phase: "waiting" | "decision" | "ready" | "left";
  /** DECISION_REQUIRED에서 WAIT를 이미 선택했는지(재질의 방지, BE hasConfirmedWait와 동일 의도). */
  decisionResolved: boolean;
  /**
   * DECISION_REQUIRED를 처음 노출한 시각(epoch ms) - BE의 mark-asked.lua와 동일하게 최초
   * 1회만 기록하고 재폴링해도 갱신하지 않는다(decisionDeadlineEpochMs 계산 기준점).
   */
  decisionAskedAt: number | null;
};

type MockDb = {
  orders: Map<string, Order>;
  orderIdByIdempotencyKey: Map<string, string>;
  payments: Map<string, StoredPayment>;
  charges: Map<string, StoredCharge>;
  refunds: RefundResponse[];
  wallet: { balance: number };
  /** dropId → 대기열 항목(단일 목 유저 세션 기준 — order 목과 동일하게 유저 스코프 없음). */
  queue: Map<string, MockQueueEntry>;
};

/** dev/test 공용 인메모리 상태 — 주문→결제→완료→환불 흐름을 모의로 일관 처리. */
export const mockDb: MockDb = createInitialDb();

function createInitialDb(): MockDb {
  return {
    orders: new Map(),
    orderIdByIdempotencyKey: new Map(),
    payments: new Map(),
    charges: new Map(),
    refunds: [],
    wallet: { balance: 1_000_000 },
    queue: new Map(),
  };
}

/** 테스트 간 상태 격리를 위해 setup 의 afterEach 에서 호출. */
export function resetMockDb(): void {
  mockDb.orders.clear();
  mockDb.orderIdByIdempotencyKey.clear();
  mockDb.payments.clear();
  mockDb.charges.clear();
  mockDb.refunds.length = 0;
  mockDb.wallet.balance = 1_000_000;
  mockDb.queue.clear();
}

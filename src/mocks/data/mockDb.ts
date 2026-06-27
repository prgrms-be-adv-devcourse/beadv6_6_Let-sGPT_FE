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

type MockDb = {
  orders: Map<string, Order>;
  orderIdByIdempotencyKey: Map<string, string>;
  payments: Map<string, StoredPayment>;
  charges: Map<string, StoredCharge>;
  refunds: RefundResponse[];
  wallet: { balance: number };
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
}

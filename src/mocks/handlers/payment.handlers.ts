import { HttpResponse, http } from "msw";
import type {
  PaymentResponse,
  RefundResponse,
  WalletChargeResponse,
} from "@/features/payment/model/payment.schema";
import { uuid } from "@/shared/lib/id";
import { mockDb } from "../data/mockDb";

function completeOrder(orderId: string, paymentId: string) {
  const order = mockDb.orders.get(orderId);
  if (order) {
    order.status = "COMPLETED";
    order.paymentId = paymentId;
  }
}

export const paymentHandlers = [
  http.post("*/api/v1/payments", async ({ request }) => {
    const body = (await request.json()) as {
      orderId: string;
      amount: number;
      method: "WALLET" | "PG";
    };
    const paymentId = uuid();

    if (body.method === "WALLET") {
      if (mockDb.wallet.balance < body.amount) {
        return HttpResponse.json(
          { error: "INSUFFICIENT_BALANCE", message: "지갑 잔액이 부족합니다." },
          { status: 409 },
        );
      }
      mockDb.wallet.balance -= body.amount;
      mockDb.payments.set(paymentId, {
        paymentId,
        orderId: body.orderId,
        amount: body.amount,
        method: "WALLET",
        status: "APPROVED",
        paymentKey: null,
      });
      completeOrder(body.orderId, paymentId);
      return HttpResponse.json<PaymentResponse>(
        { paymentId, status: "APPROVED", paymentKey: null },
        { status: 201 },
      );
    }

    mockDb.payments.set(paymentId, {
      paymentId,
      orderId: body.orderId,
      amount: body.amount,
      method: "PG",
      status: "PAYMENT_PENDING",
      paymentKey: null,
    });
    return HttpResponse.json<PaymentResponse>(
      { paymentId, status: "PAYMENT_PENDING", paymentKey: null },
      { status: 201 },
    );
  }),

  http.post("*/api/v1/payments/confirm", async ({ request }) => {
    const body = (await request.json()) as {
      orderId: string;
      amount: number;
      paymentKey: string;
    };
    const payment = [...mockDb.payments.values()].find(
      (item) => item.orderId === body.orderId && item.method === "PG",
    );
    const paymentId = payment?.paymentId ?? uuid();
    if (payment) {
      payment.status = "APPROVED";
      payment.paymentKey = body.paymentKey;
    }
    completeOrder(body.orderId, paymentId);
    return HttpResponse.json<PaymentResponse>({ paymentId, status: "APPROVED", paymentKey: null });
  }),

  http.get("*/api/v1/payments/:id", ({ params }) => {
    const payment = mockDb.payments.get(String(params.id));
    if (!payment) {
      return HttpResponse.json(
        { error: "NOT_FOUND", message: "결제를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return HttpResponse.json<PaymentResponse>({
      paymentId: payment.paymentId,
      status: payment.status,
      paymentKey: null,
    });
  }),

  http.post("*/api/v1/refunds", async ({ request }) => {
    const body = (await request.json()) as {
      paymentId: string;
      amount: number;
      reason: string;
    };
    const refund: RefundResponse = {
      refundId: uuid(),
      paymentId: body.paymentId,
      amount: body.amount,
      status: "COMPLETE",
    };
    mockDb.refunds.unshift(refund);
    mockDb.wallet.balance += body.amount;
    const order = [...mockDb.orders.values()].find((item) => item.paymentId === body.paymentId);
    if (order) {
      order.status = "REFUNDED";
    }
    return HttpResponse.json(refund, { status: 201 });
  }),

  http.get("*/api/v1/refunds/histories", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "0");
    const size = Number(url.searchParams.get("size") ?? "20");
    const start = page * size;
    return HttpResponse.json({
      content: mockDb.refunds.slice(start, start + size),
      totalPages: Math.max(1, Math.ceil(mockDb.refunds.length / size)),
    });
  }),

  http.post("*/api/v1/wallet/charge", async ({ request }) => {
    const body = (await request.json()) as { amount: number; method: "MOCK" | "PG" };
    const chargeId = uuid();
    if (body.method === "MOCK") {
      mockDb.wallet.balance += body.amount;
      mockDb.charges.set(chargeId, {
        chargeId,
        amount: body.amount,
        method: "MOCK",
        status: "APPROVED",
      });
      return HttpResponse.json<WalletChargeResponse>(
        { chargeId, status: "APPROVED" },
        { status: 201 },
      );
    }
    mockDb.charges.set(chargeId, {
      chargeId,
      amount: body.amount,
      method: "PG",
      status: "PENDING",
    });
    return HttpResponse.json<WalletChargeResponse>(
      { chargeId, status: "PENDING" },
      { status: 201 },
    );
  }),

  http.post("*/api/v1/wallet/charge/confirm", async ({ request }) => {
    const body = (await request.json()) as { chargeId: string; amount: number; paymentKey: string };
    const charge = mockDb.charges.get(body.chargeId);
    if (charge) {
      charge.status = "APPROVED";
      mockDb.wallet.balance += charge.amount;
    }
    return HttpResponse.json<WalletChargeResponse>({ chargeId: body.chargeId, status: "APPROVED" });
  }),

  // 지갑 잔액 조회(BE 구현됨: GET /api/v1/wallet → { balance }). 목은 mockDb 잔액 반환.
  http.get("*/api/v1/wallet", () => HttpResponse.json({ balance: mockDb.wallet.balance })),
];

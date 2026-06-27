import { apiFetch } from "@/shared/api/http";
import { newIdempotencyKey } from "@/shared/lib/id";
import {
  type PaymentResponse,
  paymentResponseSchema,
  type RefundHistory,
  type RefundResponse,
  refundHistorySchema,
  refundResponseSchema,
  type WalletChargeResponse,
  walletChargeResponseSchema,
} from "../model/payment.schema";

/** 결제 생성: WALLET=즉시 APPROVED / PG=PAYMENT_PENDING(이후 confirm). */
export function createPayment(input: {
  orderId: string;
  amount: number;
  method: "WALLET" | "PG";
}): Promise<PaymentResponse> {
  return apiFetch("/api/v1/payments", paymentResponseSchema, {
    method: "POST",
    body: input,
    idempotencyKey: newIdempotencyKey("pay"),
  });
}

/** PG 결제 승인 확정(브라우저 토스 SDK 가 발급한 paymentKey 전달). */
export function confirmPayment(input: {
  orderId: string;
  amount: number;
  paymentKey: string;
}): Promise<PaymentResponse> {
  return apiFetch("/api/v1/payments/confirm", paymentResponseSchema, {
    method: "POST",
    body: input,
    idempotencyKey: newIdempotencyKey("pay-confirm"),
  });
}

export function getPayment(id: string): Promise<PaymentResponse> {
  return apiFetch(`/api/v1/payments/${id}`, paymentResponseSchema, { auth: false });
}

export function requestRefund(input: {
  paymentId: string;
  amount: number;
  reason: string;
}): Promise<RefundResponse> {
  return apiFetch("/api/v1/refunds", refundResponseSchema, {
    method: "POST",
    body: input,
    idempotencyKey: newIdempotencyKey("refund"),
  });
}

export function getRefundHistories(
  params: { page?: number; size?: number } = {},
): Promise<RefundHistory> {
  return apiFetch("/api/v1/refunds/histories", refundHistorySchema, {
    query: { page: params.page, size: params.size },
  });
}

export function chargeWallet(input: {
  amount: number;
  method: "MOCK" | "PG";
}): Promise<WalletChargeResponse> {
  return apiFetch("/api/v1/wallet/charge", walletChargeResponseSchema, {
    method: "POST",
    body: input,
    idempotencyKey: newIdempotencyKey("charge"),
  });
}

export function confirmWalletCharge(input: {
  chargeId: string;
  amount: number;
  paymentKey: string;
}): Promise<WalletChargeResponse> {
  return apiFetch("/api/v1/wallet/charge/confirm", walletChargeResponseSchema, {
    method: "POST",
    body: input,
    idempotencyKey: newIdempotencyKey("charge-confirm"),
  });
}

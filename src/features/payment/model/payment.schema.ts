import { z } from "zod";

/** Payment.Status (BE enum .name()) */
export const paymentStatusSchema = z.enum([
  "PENDING",
  "PAYMENT_PENDING",
  "APPROVED",
  "FAILED",
  "CANCELED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export const paymentResponseSchema = z.object({
  paymentId: z.string(),
  status: paymentStatusSchema,
  paymentKey: z.string().nullable(),
});
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;

/** Refund.Status */
export const refundStatusSchema = z.enum(["PENDING", "COMPLETE", "FAILED"]);

export const refundResponseSchema = z.object({
  refundId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  status: refundStatusSchema,
});
export type RefundResponse = z.infer<typeof refundResponseSchema>;

/** 환불 이력 응답(PageResponse 가 아니라 content+totalPages 만). */
export const refundHistorySchema = z.object({
  content: z.array(refundResponseSchema),
  totalPages: z.number(),
});
export type RefundHistory = z.infer<typeof refundHistorySchema>;

/** WalletCharge.Status */
export const walletChargeStatusSchema = z.enum(["PENDING", "APPROVED", "FAILED"]);

export const walletChargeResponseSchema = z.object({
  chargeId: z.string(),
  status: walletChargeStatusSchema,
});
export type WalletChargeResponse = z.infer<typeof walletChargeResponseSchema>;

/** 지갑 잔액 조회 응답(`GET /api/v1/wallet` → `{ balance }`). BE 구현됨(WalletController). */
export const walletBalanceSchema = z.object({ balance: z.number() });
export type WalletBalance = z.infer<typeof walletBalanceSchema>;

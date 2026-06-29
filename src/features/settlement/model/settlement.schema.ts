import { z } from "zod";

import { pageResponseSchema } from "@/shared/api/pagination";

/** `SettlementOrderStatus` / `SellerSettlementStatus` (BE enum). */
export const settlementOrderStatusSchema = z.enum(["READY", "COMPLETED"]);
export const sellerSettlementStatusSchema = z.enum(["READY", "COMPLETED", "FAILED"]);
export const settlementBatchStatusSchema = z.enum(["READY", "RUNNING", "COMPLETED", "FAILED"]);
export const settlementBatchTypeSchema = z.enum([
  "LOAD_PAYMENT",
  "LOAD_REFUND",
  "SETTLEMENT_RUN",
  "SETTLEMENT_RETRY",
]);

/** `SettlementOrderSummary` — 주문 단위 정산 내역. */
export const settlementOrderSummarySchema = z.object({
  id: z.string(),
  sellerSettlementId: z.string().nullable(),
  paymentId: z.string(),
  orderId: z.string(),
  sellerId: z.string(),
  buyerId: z.string(),
  productId: z.string(),
  settlementMonth: z.string(),
  orderAmount: z.number(),
  paidAmount: z.number(),
  feeAmount: z.number(),
  refundAmount: z.number(),
  netSettlementAmount: z.number(),
  status: settlementOrderStatusSchema,
  paidAt: z.string().nullable(),
});
export type SettlementOrderSummary = z.infer<typeof settlementOrderSummarySchema>;

/** `SellerSettlementSummary` — 판매자·월 단위 집계 정산. */
export const sellerSettlementSummarySchema = z.object({
  id: z.string(),
  batchId: z.string().nullable(),
  settlementMonth: z.string(),
  sellerId: z.string(),
  totalOrderCount: z.number(),
  totalPaidAmount: z.number(),
  totalFeeAmount: z.number(),
  totalRefundAmount: z.number(),
  totalAdjustmentAmount: z.number(),
  finalSettlementAmount: z.number(),
  status: sellerSettlementStatusSchema,
  completedAt: z.string().nullable(),
  failReason: z.string().nullable(),
  failedAt: z.string().nullable(),
});
export type SellerSettlementSummary = z.infer<typeof sellerSettlementSummarySchema>;

export const settlementOrderPageSchema = pageResponseSchema(settlementOrderSummarySchema);
export type SettlementOrderPage = z.infer<typeof settlementOrderPageSchema>;

export const sellerSettlementPageSchema = pageResponseSchema(sellerSettlementSummarySchema);
export type SellerSettlementPage = z.infer<typeof sellerSettlementPageSchema>;

/** `SettlementBatchResultSummary` — 관리자용 월 자동 정산 배치 실행 결과. */
export const settlementBatchResultSummarySchema = z.object({
  batchId: z.string().uuid(),
  settlementMonth: z.string().regex(/^\d{6}$/),
  batchType: settlementBatchTypeSchema,
  status: settlementBatchStatusSchema,
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  totalOrderCount: z.number(),
  totalSellerCount: z.number(),
  totalSettlementAmount: z.number(),
  failReason: z.string().nullable(),
  createdAt: z.string(),
});
export type SettlementBatchResultSummary = z.infer<typeof settlementBatchResultSummarySchema>;

export const settlementBatchResultPageSchema = pageResponseSchema(
  settlementBatchResultSummarySchema,
);
export type SettlementBatchResultPage = z.infer<typeof settlementBatchResultPageSchema>;

import { z } from "zod";
import { pageResponseSchema } from "@/shared/api/pagination";

export const orderStatusSchema = z.enum([
  "PAYMENT_PENDING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "CANCEL_REQUESTED",
  "REFUND_PENDING",
  "REFUNDED",
  "REFUND_FAILED",
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderFailCodeSchema = z.enum([
  "SOLD_OUT",
  "DROP_NOT_OPEN",
  "DROP_CLOSED",
  "LIMIT_EXCEEDED",
  "PAYMENT_FAILED",
  "PAYMENT_EXPIRED",
  "PAYMENT_STATUS_CHECK_FAILED",
  "PG_ERROR",
  "PRODUCT_INTEGRATION_FAILED",
  "STOCK_ROLLBACK_FAILED",
]);

/** 주문 생성 응답(결제 화면 진입에 필요한 최소 정보). status 는 항상 PAYMENT_PENDING. */
export const createOrderResponseSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  amount: z.number(),
  orderName: z.string(),
  paymentExpiresAt: z.string(),
});
export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;

export const orderSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  dropId: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number(),
  totalPrice: z.number(),
  status: orderStatusSchema,
  paymentId: z.string().nullable(),
  paymentExpiresAt: z.string(),
  failCode: orderFailCodeSchema.nullable(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const orderSummarySchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  dropId: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number(),
  totalPrice: z.number(),
  status: orderStatusSchema,
  createdAt: z.string(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const orderPageSchema = pageResponseSchema(orderSummarySchema);
export type OrderPage = z.infer<typeof orderPageSchema>;

export const orderCancelResponseSchema = z.object({
  orderId: z.string(),
  status: orderStatusSchema,
});
export type OrderCancelResponse = z.infer<typeof orderCancelResponseSchema>;

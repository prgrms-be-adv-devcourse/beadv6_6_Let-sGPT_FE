import { apiFetch } from "@/shared/api/http";
import { newIdempotencyKey } from "@/shared/lib/id";
import {
  type CreateOrderResponse,
  createOrderResponseSchema,
  type Order,
  type OrderCancelResponse,
  type OrderPage,
  type OrderStatus,
  orderCancelResponseSchema,
  orderPageSchema,
  orderSchema,
} from "../model/order.schema";

/** 드롭 주문 생성(멱등키 동봉) → PAYMENT_PENDING. */
export function createOrder(input: {
  dropId: string;
  quantity: number;
}): Promise<CreateOrderResponse> {
  return apiFetch("/api/v1/orders", createOrderResponseSchema, {
    method: "POST",
    body: {
      dropId: input.dropId,
      quantity: input.quantity,
      idempotencyKey: newIdempotencyKey("order"),
    },
  });
}

export function getOrder(orderId: string): Promise<Order> {
  return apiFetch(`/api/v1/orders/${orderId}`, orderSchema);
}

export function getMyOrders(
  params: { status?: OrderStatus; page?: number; size?: number } = {},
): Promise<OrderPage> {
  return apiFetch("/api/v1/orders", orderPageSchema, {
    query: { status: params.status, page: params.page, size: params.size },
  });
}

export function cancelOrder(orderId: string): Promise<OrderCancelResponse> {
  return apiFetch(`/api/v1/orders/${orderId}/cancel`, orderCancelResponseSchema, {
    method: "POST",
  });
}

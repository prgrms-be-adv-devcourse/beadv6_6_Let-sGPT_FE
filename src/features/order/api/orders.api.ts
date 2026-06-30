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

/**
 * 드롭 주문 생성(멱등키 동봉) → PAYMENT_PENDING.
 * orderName(표시명)은 FE 가 조회한 상품명을 그대로 전달 — BE 가 이를 주문 표시명으로 저장한다
 * (미전달 시 BE 는 주문번호로 폴백). 주문 시점에 클라가 가진 productName 을 넘긴다.
 */
export function createOrder(input: {
  dropId: string;
  quantity: number;
  orderName: string;
}): Promise<CreateOrderResponse> {
  return apiFetch("/api/v1/orders", createOrderResponseSchema, {
    method: "POST",
    body: {
      dropId: input.dropId,
      quantity: input.quantity,
      orderName: input.orderName,
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

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
 * BE 세미 구현에서 필수값이다. 주문 시점에 클라가 가진 productName 을 넘긴다.
 *
 * `idempotencyKey`를 명시적으로 받는 이유: 게이트웨이가 다운스트림 5xx/연결오류 시 이미 소진한
 * 대기열 입장권을 복구해주는데(restore-admission.lua), 그 전제는 "재시도가 같은 키를 재사용
 * 한다"는 것이다 — 재시도마다 새 키를 생성하면 order 는 서로 다른 요청으로 보고 실제로는 성공한
 * 주문(응답만 유실)을 중복 생성할 수 있다. 그래서 이 함수는 새 키를 스스로 만들지 않는다 — 호출부
 * (하나의 구매 시도 생명주기를 아는 쪽)가 최초 시도 시 키를 만들어 들고 있다가 재시도에 그대로
 * 넘겨야 한다. 인자를 생략하면(다른 신규 호출부 대비 기본값) 매번 새 키를 생성한다.
 */
export function createOrder(input: {
  dropId: string;
  quantity: number;
  orderName: string;
  idempotencyKey?: string;
}): Promise<CreateOrderResponse> {
  return apiFetch("/api/v1/orders", createOrderResponseSchema, {
    method: "POST",
    body: {
      dropId: input.dropId,
      quantity: input.quantity,
      orderName: input.orderName,
      idempotencyKey: input.idempotencyKey ?? newIdempotencyKey("order"),
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

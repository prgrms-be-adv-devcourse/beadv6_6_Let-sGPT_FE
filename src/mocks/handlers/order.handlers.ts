import { HttpResponse, http } from "msw";

import type {
  CreateOrderResponse,
  Order,
  OrderStatus,
  OrderSummary,
} from "@/features/order/model/order.schema";
import { findDrop } from "../data/drops";
import { mockDb } from "../data/mockDb";

function toSummary(order: Order): OrderSummary {
  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    dropId: order.dropId,
    productId: order.productId,
    productName: order.productName,
    quantity: order.quantity,
    totalPrice: order.totalPrice,
    status: order.status,
    createdAt: order.createdAt,
  };
}

function toCreateResponse(order: Order, status: number) {
  const body: CreateOrderResponse = {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    status: order.status,
    amount: order.totalPrice,
    orderName: order.productName,
    paymentExpiresAt: order.paymentExpiresAt,
  };
  return HttpResponse.json(body, { status });
}

export const orderHandlers = [
  http.post("*/api/v1/orders", async ({ request }) => {
    const body = (await request.json()) as {
      dropId: string;
      quantity: number;
      idempotencyKey: string;
    };

    const existingId = mockDb.orderIdByIdempotencyKey.get(body.idempotencyKey);
    if (existingId) {
      const existing = mockDb.orders.get(existingId);
      if (existing) {
        return toCreateResponse(existing, 200);
      }
    }

    const drop = findDrop(body.dropId);
    if (!drop) {
      return HttpResponse.json(
        { error: "DROP_NOT_FOUND", message: "드롭을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    if (drop.status !== "OPEN") {
      return HttpResponse.json(
        { error: "DROP_NOT_OPEN", message: "진행중인 드롭이 아닙니다." },
        { status: 400 },
      );
    }
    if (drop.remainingQuantity < body.quantity) {
      return HttpResponse.json(
        { error: "SOLD_OUT", message: "남은 수량이 부족합니다." },
        { status: 409 },
      );
    }

    const now = Date.now();
    const orderId = crypto.randomUUID();
    const order: Order = {
      orderId,
      orderNumber: `ORD-${now}-${(now % 0xffffff).toString(16)}`,
      dropId: drop.id,
      productId: drop.productId,
      productName: drop.productName,
      quantity: body.quantity,
      totalPrice: drop.dropPrice * body.quantity,
      status: "PAYMENT_PENDING",
      paymentId: null,
      paymentExpiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
      failCode: null,
      createdAt: new Date(now).toISOString(),
    };
    mockDb.orders.set(orderId, order);
    mockDb.orderIdByIdempotencyKey.set(body.idempotencyKey, orderId);
    return toCreateResponse(order, 201);
  }),

  http.get("*/api/v1/orders/:id", ({ params }) => {
    const order = mockDb.orders.get(String(params.id));
    if (!order) {
      return HttpResponse.json(
        { error: "ORDER_NOT_FOUND", message: "주문을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return HttpResponse.json(order);
  }),

  http.get("*/api/v1/orders", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = Number(url.searchParams.get("page") ?? "0");
    const size = Number(url.searchParams.get("size") ?? "20");

    let list = [...mockDb.orders.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (status) {
      list = list.filter((order) => order.status === status);
    }
    const start = page * size;
    return HttpResponse.json({
      content: list.slice(start, start + size).map(toSummary),
      page,
      size,
      totalElements: list.length,
      totalPages: Math.max(1, Math.ceil(list.length / size)),
    });
  }),

  http.post("*/api/v1/orders/:id/cancel", ({ params }) => {
    const order = mockDb.orders.get(String(params.id));
    if (!order) {
      return HttpResponse.json(
        { error: "ORDER_NOT_FOUND", message: "주문을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    let next: OrderStatus;
    if (order.status === "PAYMENT_PENDING") {
      next = "CANCELLED";
    } else if (order.status === "COMPLETED") {
      next = "CANCEL_REQUESTED";
    } else {
      return HttpResponse.json(
        { error: "ORDER_INVALID_STATUS", message: "취소할 수 없는 상태입니다." },
        { status: 409 },
      );
    }
    order.status = next;
    return HttpResponse.json({ orderId: order.orderId, status: next });
  }),
];

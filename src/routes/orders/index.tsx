import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { useMyOrders } from "@/features/order/api/orders.queries";
import type { OrderStatus } from "@/features/order/model/order.schema";
import { OrderStatusBadge } from "@/features/order/ui/OrderStatusBadge";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { FilterChip } from "@/shared/ui/FilterChip";
import { Pagination } from "@/shared/ui/Pagination";

export const Route = createFileRoute("/orders/")({
  component: OrderListPage,
});

const PAGE_SIZE = 10;

const STATUS_TABS: { value: OrderStatus | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  { value: "PAYMENT_PENDING", label: "결제 대기" },
  { value: "COMPLETED", label: "결제 완료" },
  { value: "CANCELLED", label: "취소" },
  { value: "REFUNDED", label: "환불" },
];

function OrderListPage() {
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [page, setPage] = useState(0);
  const orders = useMyOrders({ ...(status ? { status } : {}), page, size: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Orders</p>
        <h1 className="font-serif text-4xl tracking-tight">주문 내역</h1>
      </header>

      <div className="flex flex-wrap gap-2 border-border border-b pb-4">
        {STATUS_TABS.map((tab) => (
          <FilterChip
            key={tab.label}
            active={status === tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(0);
            }}
          >
            {tab.label}
          </FilterChip>
        ))}
      </div>

      {orders.isPending ? (
        <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</p>
      ) : null}
      {orders.isError ? (
        <p className="py-16 text-center text-destructive text-sm">주문을 불러오지 못했습니다.</p>
      ) : null}
      {orders.data && orders.data.content.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground text-sm">주문 내역이 없습니다.</p>
      ) : null}
      {orders.data && orders.data.content.length > 0 ? (
        <>
          <ul className="divide-y divide-border border-border border-y">
            {orders.data.content.map((order) => (
              <li key={order.orderId}>
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: order.orderId }}
                  className="-mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-4 transition-colors hover:bg-surface"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>
                    <p className="truncate font-medium">
                      {order.productName}{" "}
                      <span className="text-muted-foreground">× {order.quantity}</span>
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {order.orderNumber}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatKrw(order.totalPrice)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={orders.data.totalPages} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

import { Link } from "@tanstack/react-router";

import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { useMyOrders } from "../api/orders.queries";
import { OrderStatusBadge } from "./OrderStatusBadge";

/** 마이페이지용 최근 주문 요약(최신 5건) — 전체는 /orders 로 이동. */
export function RecentOrdersSection() {
  const orders = useMyOrders({ page: 0, size: 5 });

  if (orders.isPending) {
    return <p className="py-12 text-center text-muted-foreground text-sm">불러오는 중…</p>;
  }
  if (orders.isError) {
    return (
      <p className="py-12 text-center text-destructive text-sm">주문을 불러오지 못했습니다.</p>
    );
  }
  if (orders.data.content.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">아직 주문 내역이 없습니다.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/drops">드롭 둘러보기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              </div>
              <span className="shrink-0 font-medium tabular-nums">
                {formatKrw(order.totalPrice)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to="/orders"
        className="block text-center text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        전체 주문 보기 →
      </Link>
    </div>
  );
}

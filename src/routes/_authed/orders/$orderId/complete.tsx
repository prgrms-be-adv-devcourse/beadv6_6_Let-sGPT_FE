import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckIcon, Clock } from "lucide-react";
import { useEffect } from "react";

import { useOrder } from "@/features/order/api/orders.queries";
import { OrderStatusBadge } from "@/features/order/ui/OrderStatusBadge";
import { formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { LoadingState } from "@/shared/ui/LoadingState";

export const Route = createFileRoute("/_authed/orders/$orderId/complete")({
  component: OrderCompletePage,
});

function OrderCompletePage() {
  const { orderId } = Route.useParams();
  const order = useOrder(orderId);
  const status = order.data?.status;

  useEffect(() => {
    if (!status || status === "COMPLETED") return;
    const id = window.setInterval(() => void order.refetch(), 1500);
    return () => window.clearInterval(id);
  }, [order.refetch, status]);

  if (order.isPending) {
    return <LoadingState label="주문 상태를 확인하는 중" />;
  }
  if (order.isError || !order.data) {
    return (
      <p className="py-16 text-center text-destructive text-sm">주문을 불러오지 못했습니다.</p>
    );
  }

  const item = order.data;
  const completed = item.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-md py-8 text-center sm:py-16">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-foreground text-background">
        {completed ? <CheckIcon className="size-7" /> : <Clock className="size-7" />}
      </div>
      <h1 className="mt-6 font-serif text-3xl tracking-tight">
        {completed ? "주문이 완료되었습니다" : "결제 상태를 확인하고 있습니다"}
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        {completed
          ? "한정판 드롭 참여가 확정되었어요."
          : "결제 승인 후 주문 반영까지 잠시 걸릴 수 있습니다."}
      </p>
      <div className="mt-4 flex justify-center">
        <OrderStatusBadge status={item.status} />
      </div>

      <dl className="mt-8 space-y-3 rounded-lg border p-5 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">주문번호</dt>
          <dd className="text-right tabular-nums">{item.orderNumber}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">상품</dt>
          <dd className="text-right">{item.productName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">수량</dt>
          <dd className="tabular-nums">{item.quantity}</dd>
        </div>
        <div className="flex items-baseline justify-between border-border border-t pt-3">
          <dt>결제 금액</dt>
          <dd className="font-semibold tabular-nums">{formatKrw(item.totalPrice)}</dd>
        </div>
      </dl>

      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/drops">드롭 더 보기</Link>
        </Button>
        {item.status === "PAYMENT_PENDING" ? (
          <Button asChild className="flex-1">
            <Link to="/checkout/$orderId" params={{ orderId }}>
              결제 계속하기
            </Link>
          </Button>
        ) : (
          <Button asChild className="flex-1">
            <Link to="/">홈으로</Link>
          </Button>
        )}
      </div>

      <Link
        to="/orders/$orderId"
        params={{ orderId }}
        className="mt-4 block text-center text-muted-foreground text-sm underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        주문 상세 보기
      </Link>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";

import { useCancelOrder, useOrder } from "@/features/order/api/orders.queries";
import { OrderStatusBadge } from "@/features/order/ui/OrderStatusBadge";
import { useRequestRefund } from "@/features/payment/api/payments.queries";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";

export const Route = createFileRoute("/_authed/orders/$orderId/")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const order = useOrder(orderId);
  const cancel = useCancelOrder();
  const refund = useRequestRefund();

  if (order.isPending) {
    return <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</p>;
  }
  if (order.isError || !order.data) {
    return (
      <p className="py-16 text-center text-destructive text-sm">주문을 불러오지 못했습니다.</p>
    );
  }

  const item = order.data;

  async function handleRefundRequest() {
    try {
      await cancel.mutateAsync(orderId);
      await refund.mutateAsync({
        paymentId: item.paymentId!,
        amount: item.totalPrice,
        reason: "고객 환불 요청",
      });
    } catch {
      // cancel.isError / refund.isError에서 렌더링됨
    }
  }

  function actions() {
    if (item.status === "PAYMENT_PENDING") {
      return (
        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link to="/checkout/$orderId" params={{ orderId }}>
              결제하기
            </Link>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(orderId)}
          >
            주문 취소
          </Button>
        </div>
      );
    }
    if (item.status === "COMPLETED") {
      const isPending = cancel.isPending || refund.isPending;
      return (
        <Button
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={() => void handleRefundRequest()}
        >
          {isPending ? "처리 중…" : "환불 요청"}
        </Button>
      );
    }
    return null;
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Order</p>
        <h1 className="font-serif text-4xl tracking-tight">주문 상세</h1>
      </header>

      <section className="space-y-3 rounded-lg border p-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">상태</span>
          <OrderStatusBadge status={item.status} />
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">주문번호</span>
          <span className="text-right tabular-nums">{item.orderNumber}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">상품</span>
          <Link
            to="/products/$id"
            params={{ id: item.productId }}
            className="text-right underline underline-offset-4"
          >
            {item.productName}
          </Link>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">수량</span>
          <span className="tabular-nums">{item.quantity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">주문일</span>
          <span className="tabular-nums">{formatDateTime(item.createdAt)}</span>
        </div>
        {item.status === "PAYMENT_PENDING" ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">결제 마감</span>
            <span className="tabular-nums">{formatDateTime(item.paymentExpiresAt)}</span>
          </div>
        ) : null}
        {item.failCode ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">실패 사유</span>
            <span className="text-destructive">{item.failCode}</span>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between border-border border-t pt-3">
          <span>결제 금액</span>
          <span className="font-semibold text-lg tabular-nums">{formatKrw(item.totalPrice)}</span>
        </div>
      </section>

      {actions()}
      {cancel.isError ? <p className="text-destructive text-sm">{cancel.error.message}</p> : null}
      {refund.isError ? <p className="text-destructive text-sm">{refund.error.message}</p> : null}

      <Link
        to="/orders"
        className="block text-center text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        ← 주문 내역으로
      </Link>
    </div>
  );
}

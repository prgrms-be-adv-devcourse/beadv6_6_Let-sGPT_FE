import { cn } from "@/shared/lib/utils";
import type { OrderStatus } from "../model/order.schema";

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  PAYMENT_PENDING: { label: "결제 대기", className: "bg-secondary text-secondary-foreground" },
  COMPLETED: { label: "결제 완료", className: "bg-foreground text-background" },
  FAILED: { label: "주문 실패", className: "bg-muted text-muted-foreground" },
  CANCELLED: { label: "취소됨", className: "bg-muted text-muted-foreground" },
  CANCEL_REQUESTED: { label: "취소 요청", className: "bg-secondary text-secondary-foreground" },
  REFUND_PENDING: { label: "환불 중", className: "bg-secondary text-secondary-foreground" },
  REFUNDED: { label: "환불 완료", className: "bg-muted text-muted-foreground" },
  REFUND_FAILED: { label: "환불 실패", className: "bg-destructive/10 text-destructive" },
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-medium text-xs",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

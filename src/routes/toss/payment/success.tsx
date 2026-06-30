import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";

import { useConfirmPayment } from "@/features/payment/api/payments.queries";
import { clearPaymentKey } from "@/shared/lib/idempotency";

export const Route = createFileRoute("/toss/payment/success")({
  validateSearch: z.object({
    paymentKey: z.string(),
    orderId: z.string(),
    amount: z.coerce.number(),
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const { paymentKey, orderId, amount } = Route.useSearch();
  const navigate = useNavigate();
  const confirm = useConfirmPayment();
  const called = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: URL params + mutation은 마운트 시 1회만 실행
  useEffect(() => {
    if (called.current) return;
    called.current = true;
    confirm
      .mutateAsync({ orderId, amount, paymentKey })
      .then((data) => {
        clearPaymentKey(orderId);
        if (data.status === "APPROVED") {
          void navigate({ to: "/orders/$orderId/complete", params: { orderId } });
        }
      })
      .catch(() => {
        clearPaymentKey(orderId);
      });
  }, []);

  if (confirm.isError) {
    return (
      <p className="py-16 text-center text-destructive text-sm">
        결제 승인에 실패했습니다. {confirm.error.message}
      </p>
    );
  }

  if (confirm.isSuccess) {
    if (confirm.data.status !== "APPROVED") {
      return (
        <p className="py-16 text-center text-destructive text-sm">
          결제가 승인되지 않았습니다. (상태: {confirm.data.status})
        </p>
      );
    }
    return <p className="py-16 text-center text-muted-foreground text-sm">이동 중…</p>;
  }

  return <p className="py-16 text-center text-muted-foreground text-sm">결제 확인 중…</p>;
}

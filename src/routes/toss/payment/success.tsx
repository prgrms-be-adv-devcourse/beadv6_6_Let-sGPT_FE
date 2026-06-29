import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";

import { useConfirmPayment } from "@/features/payment/api/payments.queries";

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

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    confirm.mutate({ orderId, amount, paymentKey });
  }, [orderId, amount, paymentKey, confirm]);

  if (confirm.isError) {
    return (
      <p className="py-16 text-center text-destructive text-sm">
        결제 승인에 실패했습니다. {confirm.error.message}
      </p>
    );
  }

  if (confirm.isSuccess) {
    if (confirm.data.status === "APPROVED") {
      void navigate({ to: "/orders/$orderId/complete", params: { orderId } });
      return null;
    }
    return (
      <p className="py-16 text-center text-destructive text-sm">
        결제가 승인되지 않았습니다. (상태: {confirm.data.status})
      </p>
    );
  }

  return <p className="py-16 text-center text-muted-foreground text-sm">결제 확인 중…</p>;
}

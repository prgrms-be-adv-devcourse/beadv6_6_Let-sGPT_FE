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
    confirm.mutate(
      { orderId, amount, paymentKey },
      {
        onSuccess() {
          void navigate({ to: "/orders/$orderId/complete", params: { orderId } });
        },
      },
    );
  }, [orderId, amount, paymentKey, confirm, navigate]);

  if (confirm.isError) {
    return (
      <p className="py-16 text-center text-destructive text-sm">
        결제 승인에 실패했습니다. {confirm.error.message}
      </p>
    );
  }

  return <p className="py-16 text-center text-muted-foreground text-sm">결제 확인 중…</p>;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";

import { useConfirmWalletCharge } from "@/features/payment/api/payments.queries";

export const Route = createFileRoute("/toss/charge/success")({
  validateSearch: z.object({
    paymentKey: z.string(),
    orderId: z.string(),
    amount: z.coerce.number(),
  }),
  component: ChargeSuccessPage,
});

function ChargeSuccessPage() {
  const { paymentKey, orderId: chargeId, amount } = Route.useSearch();
  const navigate = useNavigate();
  const confirm = useConfirmWalletCharge();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    confirm.mutate(
      { chargeId, amount, paymentKey },
      {
        onSuccess(data) {
          if (data.status === "APPROVED") {
            void navigate({ to: "/mypage" });
          }
        },
      },
    );
  }, [chargeId, amount, paymentKey, confirm, navigate]);

  if (confirm.isError) {
    return (
      <p className="py-16 text-center text-destructive text-sm">
        충전 승인에 실패했습니다. {confirm.error.message}
      </p>
    );
  }

  return <p className="py-16 text-center text-muted-foreground text-sm">충전 확인 중…</p>;
}

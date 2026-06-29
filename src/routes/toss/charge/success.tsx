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
    confirm.mutate({ chargeId, amount, paymentKey });
  }, [chargeId, amount, paymentKey, confirm]);

  if (confirm.isError) {
    return (
      <p className="py-16 text-center text-destructive text-sm">
        충전 승인에 실패했습니다. {confirm.error.message}
      </p>
    );
  }

  if (confirm.isSuccess) {
    if (confirm.data.status === "APPROVED") {
      void navigate({ to: "/mypage" });
      return null;
    }
    return (
      <p className="py-16 text-center text-destructive text-sm">
        충전이 승인되지 않았습니다. (상태: {confirm.data.status})
      </p>
    );
  }

  return <p className="py-16 text-center text-muted-foreground text-sm">충전 확인 중…</p>;
}

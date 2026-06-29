import { useState } from "react";

import { formatKrw } from "@/shared/lib/format";
import { createTossPayment } from "@/shared/lib/toss";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { useChargeWallet, useWalletBalance } from "../api/payments.queries";

const CHARGE_PRESETS = [10_000, 30_000, 50_000, 100_000];

type ChargeMethod = "MOCK" | "PG_CARD" | "PG_TRANSFER";

const CHARGE_METHODS: { value: ChargeMethod; label: string; desc: string }[] = [
  { value: "MOCK", label: "모의 충전", desc: "즉시 잔액 반영(테스트용)" },
  { value: "PG_CARD", label: "카드 충전", desc: "토스페이먼츠 — 카드" },
  { value: "PG_TRANSFER", label: "계좌이체 충전", desc: "토스페이먼츠 — 계좌이체" },
];

const TOSS_METHOD: Record<"PG_CARD" | "PG_TRANSFER", "CARD" | "TRANSFER"> = {
  PG_CARD: "CARD",
  PG_TRANSFER: "TRANSFER",
};

/** 지갑 — 잔액 조회(provisional GET /wallet) + 충전(MOCK 즉시/PG 카드·계좌이체). */
export function WalletSection() {
  const balance = useWalletBalance();
  const charge = useChargeWallet();
  const [amount, setAmount] = useState(30_000);
  const [method, setMethod] = useState<ChargeMethod>("MOCK");
  const [error, setError] = useState<string | null>(null);
  const [chargedAmount, setChargedAmount] = useState<number | null>(null);

  async function handleCharge() {
    setError(null);
    try {
      const apiMethod = method === "MOCK" ? "MOCK" : "PG";
      const created = await charge.mutateAsync({ amount, method: apiMethod });
      if (method !== "MOCK" && created.status === "PENDING") {
        await createTossPayment().requestPayment({
          method: TOSS_METHOD[method],
          amount: { currency: "KRW", value: amount },
          orderId: created.chargeId,
          orderName: "지갑 충전",
          successUrl: `${window.location.origin}/toss/charge/success`,
          failUrl: `${window.location.origin}/mypage`,
        });
        return; // Toss가 브라우저를 리다이렉트, 이후 코드 미실행
      }
      setChargedAmount(amount);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "충전에 실패했습니다.");
    }
  }

  return (
    <>
      <Dialog
        open={chargedAmount !== null}
        onOpenChange={(open) => {
          if (!open) setChargedAmount(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>충전 완료</DialogTitle>
            <DialogDescription>
              {chargedAmount !== null ? formatKrw(chargedAmount) : ""}이 지갑에 충전되었습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setChargedAmount(null)}>
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Balance</p>
          <p className="mt-2 font-numeric text-4xl tracking-tight tabular-nums">
            {balance.isPending ? "—" : formatKrw(balance.data?.balance ?? 0)}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">충전</h3>
          <div className="overflow-x-auto">
            <SegmentedControl
              aria-label="충전 금액"
              options={CHARGE_PRESETS.map((preset) => ({
                value: String(preset),
                label: formatKrw(preset),
              }))}
              value={String(amount)}
              onChange={(value) => setAmount(Number(value))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHARGE_METHODS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMethod(option.value)}
                aria-pressed={method === option.value}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  method === option.value
                    ? "border-foreground bg-surface"
                    : "hover:border-foreground/40",
                )}
              >
                <p className="font-medium text-sm">{option.label}</p>
                <p className="mt-1 text-muted-foreground text-xs">{option.desc}</p>
              </button>
            ))}
          </div>
          <Button disabled={charge.isPending} onClick={() => void handleCharge()}>
            {charge.isPending ? "충전 중…" : `${formatKrw(amount)} 충전하기`}
          </Button>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
      </div>
    </>
  );
}

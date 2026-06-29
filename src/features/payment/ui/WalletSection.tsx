import { useState } from "react";

import { formatKrw } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { useChargeWallet, useConfirmWalletCharge, useWalletBalance } from "../api/payments.queries";

const CHARGE_PRESETS = [10_000, 30_000, 50_000, 100_000];

const CHARGE_METHODS = [
  { value: "MOCK" as const, label: "모의 충전", desc: "즉시 잔액 반영(테스트용)" },
  { value: "PG" as const, label: "카드 충전", desc: "토스페이먼츠(모의 결제)" },
];

/** 지갑 — 잔액 조회(provisional GET /wallet) + 충전(MOCK 즉시/PG 카드). */
export function WalletSection() {
  const balance = useWalletBalance();
  const charge = useChargeWallet();
  const confirmCharge = useConfirmWalletCharge();
  const [amount, setAmount] = useState(30_000);
  const [method, setMethod] = useState<"MOCK" | "PG">("MOCK");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pending = charge.isPending || confirmCharge.isPending;

  async function handleCharge() {
    setError(null);
    setSuccess(false);
    try {
      const created = await charge.mutateAsync({ amount, method });
      if (method === "PG" && created.status === "PENDING") {
        await confirmCharge.mutateAsync({
          chargeId: created.chargeId,
          amount,
          paymentKey: `mock-${created.chargeId}`,
        });
      }
      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "충전에 실패했습니다.");
    }
  }

  return (
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
        <Button disabled={pending} onClick={() => void handleCharge()}>
          {pending ? "충전 중…" : `${formatKrw(amount)} 충전하기`}
        </Button>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {success ? <p className="text-muted-foreground text-sm">충전이 완료되었습니다.</p> : null}
      </div>
    </div>
  );
}

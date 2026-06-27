import { useState } from "react";

import { formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { FilterChip } from "@/shared/ui/FilterChip";
import { useChargeWallet, useWalletBalance } from "../api/payments.queries";

const CHARGE_PRESETS = [10_000, 30_000, 50_000, 100_000];

/** 지갑 — 잔액 조회(provisional GET /wallet) + 모의 충전(POST /wallet/charge MOCK). */
export function WalletSection() {
  const balance = useWalletBalance();
  const charge = useChargeWallet();
  const [amount, setAmount] = useState(30_000);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Balance</p>
        <p className="mt-2 font-serif text-4xl tracking-tight tabular-nums">
          {balance.isPending ? "—" : formatKrw(balance.data?.balance ?? 0)}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">충전</h3>
        <div className="flex flex-wrap gap-2">
          {CHARGE_PRESETS.map((preset) => (
            <FilterChip key={preset} active={amount === preset} onClick={() => setAmount(preset)}>
              {formatKrw(preset)}
            </FilterChip>
          ))}
        </div>
        <Button
          disabled={charge.isPending}
          onClick={() => charge.mutate({ amount, method: "MOCK" })}
        >
          {charge.isPending ? "충전 중…" : `${formatKrw(amount)} 충전하기`}
        </Button>
        {charge.isError ? <p className="text-destructive text-sm">{charge.error.message}</p> : null}
        {charge.isSuccess ? (
          <p className="text-muted-foreground text-sm">충전이 완료되었습니다.</p>
        ) : null}
      </div>
    </div>
  );
}

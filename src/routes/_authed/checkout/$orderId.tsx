import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { useOrder } from "@/features/order/api/orders.queries";
import {
  useChargeWallet,
  useCreatePayment,
  useWalletBalance,
} from "@/features/payment/api/payments.queries";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { clearPendingChargeKey } from "@/shared/lib/idempotency";
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
import { LoadingState } from "@/shared/ui/LoadingState";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";

export const Route = createFileRoute("/_authed/checkout/$orderId")({
  validateSearch: z.object({
    payment: z.enum(["failed"]).optional(),
  }),
  component: CheckoutPage,
});

type PayMethod = "WALLET" | "PG_CARD" | "PG_TRANSFER";

const METHODS: { value: PayMethod; label: string; desc: string }[] = [
  { value: "WALLET", label: "지갑(예치금)", desc: "충전된 잔액으로 즉시 결제" },
  { value: "PG_CARD", label: "카드 결제", desc: "토스페이먼츠 — 카드" },
  { value: "PG_TRANSFER", label: "계좌이체", desc: "토스페이먼츠 — 계좌이체" },
];

const TOSS_METHOD: Record<"PG_CARD" | "PG_TRANSFER", "CARD" | "TRANSFER"> = {
  PG_CARD: "CARD",
  PG_TRANSFER: "TRANSFER",
};

const CHARGE_PRESETS = [10_000, 30_000, 50_000, 100_000];

function CheckoutPage() {
  const { orderId } = Route.useParams();
  const { payment } = Route.useSearch();
  const navigate = useNavigate();
  const order = useOrder(orderId);
  const createPayment = useCreatePayment();
  const chargeWallet = useChargeWallet();
  const balance = useWalletBalance();
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeAmount, setChargeAmount] = useState(CHARGE_PRESETS[1] ?? 30_000);
  const [chargeError, setChargeError] = useState<string | null>(null);

  if (order.isPending) {
    return <LoadingState label="주문을 불러오는 중" />;
  }
  if (order.isError || !order.data) {
    return (
      <p className="py-16 text-center text-destructive text-sm">주문을 불러오지 못했습니다.</p>
    );
  }

  const item = order.data;
  const alreadyPaid = item.status !== "PAYMENT_PENDING";
  const walletBalance = balance.data?.balance ?? 0;
  const insufficientWallet =
    method === "WALLET" && !balance.isPending && walletBalance < item.totalPrice;
  const walletShortage = Math.max(item.totalPrice - walletBalance, 0);
  const chargeOptions = [
    ...new Set([walletShortage, ...CHARGE_PRESETS].filter((value) => value > 0)),
  ]
    .sort((a, b) => a - b)
    .map((value) => ({ value: String(value), label: formatKrw(value) }));

  async function pay() {
    if (!method) return;
    setError(null);
    try {
      const apiMethod = method === "WALLET" ? "WALLET" : "PG";
      const created = await createPayment.mutateAsync({
        orderId,
        amount: item.totalPrice,
        method: apiMethod,
      });
      if (method !== "WALLET" && created.status === "PAYMENT_PENDING") {
        await createTossPayment().requestPayment({
          method: TOSS_METHOD[method],
          amount: { currency: "KRW", value: item.totalPrice },
          orderId,
          orderName: item.productName,
          successUrl: `${window.location.origin}/toss/payment/success`,
          failUrl: `${window.location.origin}/checkout/${orderId}?payment=failed`,
        });
        return; // Toss가 브라우저를 리다이렉트, 이후 코드 미실행
      }
      void navigate({ to: "/orders/$orderId/complete", params: { orderId } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "결제에 실패했습니다.");
    }
  }

  async function chargeInCheckout() {
    setChargeError(null);
    try {
      const result = await chargeWallet.mutateAsync({ amount: chargeAmount, method: "MOCK" });
      clearPendingChargeKey();
      if (result.status !== "APPROVED") {
        setChargeError(`충전이 완료되지 않았습니다. (상태: ${result.status})`);
        return;
      }
      await balance.refetch();
      setChargeOpen(false);
    } catch (caught) {
      clearPendingChargeKey();
      setChargeError(caught instanceof Error ? caught.message : "충전에 실패했습니다.");
    }
  }

  function selectMethod(nextMethod: PayMethod) {
    setMethod(nextMethod);
    setError(null);
    if (nextMethod === "WALLET" && !balance.isPending && walletShortage > 0) {
      setChargeError(null);
      setChargeAmount(walletShortage);
      setChargeOpen(true);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예치금 충전</DialogTitle>
            <DialogDescription>
              결제 화면을 벗어나지 않고 부족한 예치금을 충전합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-md border bg-surface p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">현재 잔액</span>
                <span className="tabular-nums">{formatKrw(walletBalance)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">부족 금액</span>
                <span className="font-medium tabular-nums">{formatKrw(walletShortage)}</span>
              </div>
            </div>
            <SegmentedControl
              aria-label="충전 금액"
              options={chargeOptions}
              value={String(chargeAmount)}
              onChange={(value) => setChargeAmount(Number(value))}
            />
            {chargeError ? <p className="text-destructive text-sm">{chargeError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChargeOpen(false)}
                disabled={chargeWallet.isPending}
              >
                닫기
              </Button>
              <Button
                type="button"
                onClick={() => void chargeInCheckout()}
                disabled={chargeWallet.isPending}
              >
                {chargeWallet.isPending ? "충전 중…" : `${formatKrw(chargeAmount)} 충전`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Checkout</p>
        <h1 className="font-serif text-4xl tracking-tight">결제</h1>
      </header>

      <section className="space-y-3 rounded-lg border p-5">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground text-sm">상품</span>
          <span className="text-right font-medium">{item.productName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-sm">수량</span>
          <span className="tabular-nums">{item.quantity}</span>
        </div>
        <div className="flex items-baseline justify-between border-border border-t pt-3">
          <span>결제 금액</span>
          <span className="font-semibold text-lg tabular-nums">{formatKrw(item.totalPrice)}</span>
        </div>
        {!alreadyPaid ? (
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Clock className="size-3.5 shrink-0" />
            <span>
              <span className="text-foreground">10분 내 결제</span> · 마감{" "}
              <span className="tabular-nums">{formatDateTime(item.paymentExpiresAt)}</span>
            </span>
          </p>
        ) : null}
      </section>

      {alreadyPaid ? (
        <div className="rounded-lg border bg-surface p-5 text-sm">
          이미 처리된 주문입니다.{" "}
          <Link
            to="/orders/$orderId/complete"
            params={{ orderId }}
            className="font-medium underline underline-offset-4"
          >
            결과 보기
          </Link>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="font-medium text-sm">결제 수단</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {METHODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectMethod(option.value)}
                  aria-pressed={method === option.value}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    method === option.value
                      ? "border-foreground bg-surface"
                      : "hover:border-foreground/40",
                  )}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {option.value === "WALLET"
                      ? balance.isPending
                        ? "잔액 불러오는 중…"
                        : `잔액 ${formatKrw(walletBalance)}`
                      : option.desc}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {method === "WALLET" ? (
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "text-xs",
                  insufficientWallet ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {insufficientWallet
                  ? "잔액이 부족합니다. 부족 금액을 충전하면 바로 결제할 수 있습니다."
                  : "충전된 예치금으로 즉시 결제됩니다."}
              </span>
            </div>
          ) : null}

          {payment === "failed" ? (
            <p className="text-destructive text-sm">
              결제가 승인되지 않았습니다. 주문은 아직 결제 대기 상태이므로 다시 결제할 수 있습니다.
            </p>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <Button
            size="lg"
            className="w-full"
            disabled={!method || createPayment.isPending || insufficientWallet}
            onClick={() => void pay()}
          >
            {createPayment.isPending
              ? "결제 처리 중…"
              : method
                ? `${formatKrw(item.totalPrice)} 결제하기`
                : "결제 수단을 선택하세요"}
          </Button>
          <p className="text-center text-muted-foreground text-xs">
            부족한 예치금은 이 화면에서 충전 후 바로 결제할 수 있습니다.
          </p>
        </>
      )}
    </div>
  );
}

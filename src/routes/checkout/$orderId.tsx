import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useOrder } from "@/features/order/api/orders.queries";
import { useConfirmPayment, useCreatePayment } from "@/features/payment/api/payments.queries";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export const Route = createFileRoute("/checkout/$orderId")({
  component: CheckoutPage,
});

const METHODS = [
  { value: "WALLET", label: "지갑(예치금)", desc: "충전된 잔액으로 즉시 결제" },
  { value: "PG", label: "카드 결제", desc: "토스페이먼츠(모의 결제)" },
] as const;

function CheckoutPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const order = useOrder(orderId);
  const createPayment = useCreatePayment();
  const confirmPayment = useConfirmPayment();
  const [method, setMethod] = useState<"WALLET" | "PG">("WALLET");
  const [error, setError] = useState<string | null>(null);

  if (order.isPending) {
    return <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</p>;
  }
  if (order.isError || !order.data) {
    return (
      <p className="py-16 text-center text-destructive text-sm">주문을 불러오지 못했습니다.</p>
    );
  }

  const item = order.data;
  const pending = createPayment.isPending || confirmPayment.isPending;
  const alreadyPaid = item.status !== "PAYMENT_PENDING";

  async function pay() {
    setError(null);
    try {
      const created = await createPayment.mutateAsync({
        orderId,
        amount: item.totalPrice,
        method,
      });
      if (method === "PG" && created.status === "PAYMENT_PENDING") {
        await confirmPayment.mutateAsync({
          orderId,
          amount: item.totalPrice,
          paymentKey: `mock-${created.paymentId}`,
        });
      }
      navigate({ to: "/orders/$orderId/complete", params: { orderId } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "결제에 실패했습니다.");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
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
          <p className="text-muted-foreground text-xs">
            결제 마감 {formatDateTime(item.paymentExpiresAt)}
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
          </section>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <Button size="lg" className="w-full" disabled={pending} onClick={pay}>
            {pending ? "결제 처리 중…" : `${formatKrw(item.totalPrice)} 결제하기`}
          </Button>
          <p className="text-center text-muted-foreground text-xs">
            지갑 잔액이 부족하면 마이페이지에서 충전할 수 있어요.
          </p>
        </>
      )}
    </div>
  );
}

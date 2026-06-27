import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useDrop } from "@/features/drop/api/drops.queries";
import { Countdown } from "@/features/drop/ui/Countdown";
import { DropStatusBadge } from "@/features/drop/ui/DropStatusBadge";
import { StockBar } from "@/features/drop/ui/StockBar";
import { useCreateOrder } from "@/features/order/api/orders.queries";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { buildGallery } from "@/shared/lib/image";
import { Button } from "@/shared/ui/button";
import { ImageGallery } from "@/shared/ui/ImageGallery";

export const Route = createFileRoute("/drops/$id")({
  component: DropDetailPage,
});

function DropDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const drop = useDrop(id);
  const createOrder = useCreateOrder();
  const [quantity, setQuantity] = useState(1);

  if (drop.isPending) {
    return <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</p>;
  }
  if (drop.isError || !drop.data) {
    return (
      <p className="py-16 text-center text-destructive text-sm">드롭을 불러오지 못했습니다.</p>
    );
  }

  const item = drop.data;
  const isOpen = item.status === "OPEN";
  const maxQty = Math.max(1, Math.min(item.remainingQuantity, 5));

  function buy() {
    createOrder.mutate(
      { dropId: item.id, quantity },
      {
        onSuccess: (order) =>
          navigate({ to: "/checkout/$orderId", params: { orderId: order.orderId } }),
      },
    );
  }

  function renderCta() {
    if (isOpen) {
      return (
        <>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">수량</span>
            <div className="inline-flex items-center rounded-md border">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                className="size-9 text-lg disabled:opacity-30"
                aria-label="수량 감소"
              >
                −
              </button>
              <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
                disabled={quantity >= maxQty}
                className="size-9 text-lg disabled:opacity-30"
                aria-label="수량 증가"
              >
                +
              </button>
            </div>
          </div>
          {createOrder.isError ? (
            <p className="text-destructive text-sm">{createOrder.error.message}</p>
          ) : null}
          <Button size="lg" className="w-full" disabled={createOrder.isPending} onClick={buy}>
            {createOrder.isPending ? "주문 처리 중…" : "주문하기"}
          </Button>
        </>
      );
    }
    if (item.status === "REGISTERED") {
      return (
        <Button size="lg" className="w-full" disabled>
          오픈 예정
        </Button>
      );
    }
    if (item.status === "CLOSE") {
      return (
        <Button size="lg" variant="outline" className="w-full" disabled>
          종료된 드롭
        </Button>
      );
    }
    return (
      <Button size="lg" variant="outline" className="w-full" disabled>
        매진
      </Button>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <ImageGallery images={buildGallery(item.thumbnailKey)} name={item.productName} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <DropStatusBadge status={item.status} />
          {item.categoryName ? (
            <span className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
              {item.categoryName}
            </span>
          ) : null}
        </div>
        <h1 className="font-serif text-4xl leading-tight tracking-tight">{item.productName}</h1>
        <p className="font-medium text-2xl tabular-nums">{formatKrw(item.dropPrice)}</p>

        <dl className="grid grid-cols-[5rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">오픈</dt>
          <dd className="tabular-nums">{formatDateTime(item.openAt)}</dd>
          <dt className="text-muted-foreground">종료</dt>
          <dd className="tabular-nums">
            {item.closeAt ? formatDateTime(item.closeAt) : "매진 시 종료"}
          </dd>
        </dl>

        {item.status === "REGISTERED" ? (
          <div className="space-y-2 border-border border-t pt-6">
            <p className="text-muted-foreground text-sm">오픈까지</p>
            <Countdown target={item.openAt} />
          </div>
        ) : null}
        {isOpen || item.status === "SOLD_OUT" ? (
          <div className="border-border border-t pt-6">
            <StockBar remaining={item.remainingQuantity} total={item.totalQuantity} />
          </div>
        ) : null}

        <div className="space-y-4 border-border border-t pt-6">
          {renderCta()}
          <p className="text-center text-muted-foreground text-xs">
            한정 수량 · 주문 후 10분 내 결제
          </p>
        </div>
      </div>
    </div>
  );
}

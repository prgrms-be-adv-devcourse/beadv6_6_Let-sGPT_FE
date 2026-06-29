import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useDrop } from "@/features/drop/api/drops.queries";
import { Countdown } from "@/features/drop/ui/Countdown";
import { DropStatusPill } from "@/features/drop/ui/DropStatusPill";
import { StockBar } from "@/features/drop/ui/StockBar";
import { useCreateOrder } from "@/features/order/api/orders.queries";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { buildGallery } from "@/shared/lib/image";
import { Button } from "@/shared/ui/button";
import { ImageGallery } from "@/shared/ui/ImageGallery";
import { Tag } from "@/shared/ui/Tag";

export const Route = createFileRoute("/drops/$id")({
  component: DropDetailPage,
});

function DropDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => Boolean(state.member));
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
    // 비로그인 상태에서는 주문 API(인증 필요)를 호출하지 않고 로그인 화면으로 보낸다.
    // 로그인 후 이 드롭 페이지로 복귀하도록 현재 경로를 redirect 로 동봉.
    if (!isAuthenticated) {
      navigate({ to: "/login", search: { redirect: location.href } });
      return;
    }
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
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm">수량</span>
              <p className="text-muted-foreground text-xs tabular-nums">최대 {maxQty}개</p>
            </div>
            <div className="-mr-2 inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                aria-label="수량 감소"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-medium text-sm tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
                disabled={quantity >= maxQty}
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                aria-label="수량 증가"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          {createOrder.isError ? (
            <p className="text-destructive text-sm">{createOrder.error.message}</p>
          ) : null}
          <Button size="lg" className="w-full" disabled={createOrder.isPending} onClick={buy}>
            {createOrder.isPending ? "주문 처리 중…" : "주문하기"}
          </Button>
        </div>
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
        <div className="flex flex-wrap items-center gap-2">
          <DropStatusPill status={item.status} />
          {item.categoryName ? <Tag>{item.categoryName}</Tag> : null}
          {item.sellerName ? (
            <span className="text-muted-foreground text-sm">{item.sellerName}</span>
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

        <div className="border-border border-t pt-6">{renderCta()}</div>
      </div>
    </div>
  );
}

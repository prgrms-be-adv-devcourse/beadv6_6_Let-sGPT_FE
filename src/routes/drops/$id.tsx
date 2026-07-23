import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useDrop } from "@/features/drop/api/drops.queries";
import { Countdown } from "@/features/drop/ui/Countdown";
import { DropStatusPill } from "@/features/drop/ui/DropStatusPill";
import { StockBar } from "@/features/drop/ui/StockBar";
import { useCreateOrder } from "@/features/order/api/orders.queries";
import { useEnterQueue } from "@/features/queue/api/queue.queries";
import type { QueueStatusResponse } from "@/features/queue/model/queue.schema";
import { QueueWaitingDialog } from "@/features/queue/ui/QueueWaitingDialog";
import { ApiError } from "@/shared/api/http";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { newIdempotencyKey } from "@/shared/lib/id";
import { buildGallery } from "@/shared/lib/image";
import { Button } from "@/shared/ui/button";

import { ImageGallery } from "@/shared/ui/ImageGallery";
import { LoadingState } from "@/shared/ui/LoadingState";
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
  const enterQueue = useEnterQueue();
  const [quantity, setQuantity] = useState(1);
  const [openingNow, setOpeningNow] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);
  // 진행 중인 주문 시도(수량 + 멱등키) — 실패 시 "다시 시도"가 같은 키를 재사용하기 위해 보관.
  // 게이트웨이가 다운스트림 5xx/연결오류 시 대기열 입장권을 복구해주는데(restore-admission.lua),
  // 그 안전 전제가 "재시도는 같은 idempotencyKey를 재사용한다"이다 — 재시도마다 새 키를 쓰면
  // 실제로는 성공했지만 응답만 유실된 주문을 order가 별개 요청으로 보고 중복 생성할 위험이 있다.
  const [pendingAttempt, setPendingAttempt] = useState<{
    quantity: number;
    idempotencyKey: string;
  } | null>(null);

  useEffect(() => {
    const item = drop.data;
    if (item?.status !== "REGISTERED") {
      setOpeningNow(false);
      return;
    }

    const delay = new Date(item.openAt).getTime() - Date.now();
    if (delay <= 0) {
      setOpeningNow(true);
      void drop.refetch();
      return;
    }

    const id = window.setTimeout(
      () => {
        setOpeningNow(true);
        void drop.refetch();
      },
      Math.min(delay + 500, 2_147_483_647),
    );
    return () => window.clearTimeout(id);
  }, [drop.data, drop.refetch]);

  if (drop.isPending) {
    return <LoadingState label="드롭을 불러오는 중" />;
  }
  if (drop.isError || !drop.data) {
    return (
      <p className="py-16 text-center text-destructive text-sm">드롭을 불러오지 못했습니다.</p>
    );
  }

  const item = drop.data;
  const isOpen = item.status === "OPEN";
  const maxQty = Math.max(1, Math.min(item.remainingQuantity, 5));

  /** 새 구매 시도 — 이 시도 전용 멱등키를 새로 발급해 보관한다(재시도는 retryOrder가 재사용). */
  function submitOrder(orderQuantity: number) {
    const idempotencyKey = newIdempotencyKey("order");
    setPendingAttempt({ quantity: orderQuantity, idempotencyKey });
    createOrder.mutate(
      { dropId: item.id, quantity: orderQuantity, orderName: item.productName, idempotencyKey },
      {
        onSuccess: (order) => {
          setPendingAttempt(null);
          navigate({ to: "/checkout/$orderId", params: { orderId: order.orderId } });
        },
      },
    );
  }

  /**
   * 직전 실패 시도를 같은 멱등키로 재시도한다("주문하기"를 다시 누르면 대기열 진입부터 다시
   * 밟는 것과 달리, 이 버튼은 이미 발급된 입장권으로 곧장 주문만 재시도한다). 다운스트림
   * 장애(5xx)였다면 order 가 idempotencyKey 로 중복 없이 처리하고, 게이트웨이 입장권 복구가
   * 실패했다면(TTL 만료 등) 419 로 거부되므로 사용자는 "주문하기"부터 다시 시작하면 된다.
   */
  function retryPendingOrder() {
    if (!pendingAttempt) return;
    createOrder.mutate(
      {
        dropId: item.id,
        quantity: pendingAttempt.quantity,
        orderName: item.productName,
        idempotencyKey: pendingAttempt.idempotencyKey,
      },
      {
        onSuccess: (order) => {
          setPendingAttempt(null);
          navigate({ to: "/checkout/$orderId", params: { orderId: order.orderId } });
        },
      },
    );
  }

  async function buy() {
    // 비로그인 상태에서는 주문 API(인증 필요)를 호출하지 않고 로그인 화면으로 보낸다.
    // 로그인 후 이 드롭 페이지로 복귀하도록 현재 경로를 redirect 로 동봉.
    if (!isAuthenticated) {
      navigate({ to: "/login", search: { redirect: location.href } });
      return;
    }

    setEntryError(null);
    try {
      // 모든 드롭이 대기열을 거친다(정적 hot-drop 목록 없음) — 경쟁이 없으면 BE가 즉시
      // READY 를 돌려주므로(즉시 입장 fast path) 대부분의 주문은 대기 다이얼로그 없이 바로
      // 아래 READY 분기로 빠진다. 실제 경쟁이 있는 드롭만 대기열 모달을 보게 된다.
      const status = await enterQueue.mutateAsync({ dropId: item.id, quantity });
      if (status.status === "READY" && typeof status.quantity === "number") {
        submitOrder(status.quantity);
        return;
      }
      // WAITING/DECISION_REQUIRED/SOLD_OUT/NOT_IN_QUEUE → 대기열 모달이 이어서 처리.
      setQueueStatus(status);
    } catch (error) {
      setEntryError(error instanceof ApiError ? error.message : "대기열 진입 확인에 실패했습니다.");
    }
  }

  // 대기열 모달이 READY 를 감지하면 호출 — 발급된 수량(원래 요청과 다를 수 있음: PARTIAL)으로
  // 주문을 생성한다. 게이트웨이는 입장권 수량과 요청 수량이 정확히 일치해야만 통과시킨다.
  function handleQueueAdmitted(admittedQuantity: number) {
    setQueueStatus(null);
    submitOrder(admittedQuantity);
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
          <Button
            size="lg"
            className="w-full"
            disabled={createOrder.isPending || enterQueue.isPending}
            onClick={buy}
          >
            {enterQueue.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                대기열 확인 중…
              </span>
            ) : createOrder.isPending ? (
              "주문 처리 중…"
            ) : (
              "주문하기"
            )}
          </Button>
          {/* 오류는 버튼 아래에 배치 — 버튼 위치를 고정해 표시/숨김 시 레이아웃 시프트(깜빡임) 방지. */}
          {createOrder.isError ? (
            <div className="space-y-2">
              <p className="text-destructive text-sm" role="alert" aria-live="polite">
                {createOrder.error.message}
              </p>
              {pendingAttempt ? (
                // 대기열부터 다시 밟는 "주문하기"와 달리, 같은 멱등키로 주문만 재시도한다 —
                // 서버 장애(5xx)로 실패했다면 게이트웨이가 입장권을 이미 복구해 뒀을 것이다.
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={retryPendingOrder}
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> 재시도 중…
                    </span>
                  ) : (
                    "같은 주문 다시 시도"
                  )}
                </Button>
              ) : null}
            </div>
          ) : entryError ? (
            <p className="text-destructive text-sm" role="alert" aria-live="polite">
              {entryError}
            </p>
          ) : null}
        </div>
      );
    }
    if (item.status === "REGISTERED") {
      return (
        <Button size="lg" className="w-full" disabled>
          {openingNow || drop.isFetching ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              오픈 상태 확인 중
            </span>
          ) : (
            "오픈 예정"
          )}
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

      {queueStatus ? (
        <QueueWaitingDialog
          dropId={item.id}
          productName={item.productName}
          initialStatus={queueStatus}
          onAdmitted={handleQueueAdmitted}
          onClose={() => setQueueStatus(null)}
        />
      ) : null}
    </div>
  );
}

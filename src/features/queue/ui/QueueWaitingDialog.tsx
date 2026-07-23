import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useDecideQueue, useQueueStatus } from "../api/queue.queries";
import type { DecisionChoice, QueueStatusResponse } from "../model/queue.schema";

/**
 * 무응답 이탈 처리 마감(BE `decisionDeadlineEpochMs`)까지 남은 초를 1초마다 갱신해 반환한다.
 * 마감이 없으면(WAIT 확정자의 SHORTFALL 재질의처럼 제거 대상이 아닌 경우) null.
 * 엄격한 FIFO 정책상 맨 앞 사람의 미결정은 대기열 전체를 정지시키므로, 사용자가 "가만히
 * 있었는데 갑자기 대기열에서 빠졌다"고 느끼지 않도록 카운트다운을 명시적으로 보여준다.
 */
function useDeadlineCountdownSeconds(deadlineEpochMs: number | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadlineEpochMs == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadlineEpochMs]);
  if (deadlineEpochMs == null) return null;
  return Math.max(0, Math.ceil((deadlineEpochMs - now) / 1000));
}

/**
 * 구버전 BE(availableChoices 필드 없음) 호환용 폴백 추론 — 신버전은 항상 서버가 권위 있게
 * 내려주므로 이 함수는 호출되지 않는다. optimisticMax < quantity(SHORTFALL)면 WAIT을 감추고,
 * grantableNow가 0이면 PARTIAL을 감춘다(같은 규칙을 BE도 적용 - QueueService.resolveStatus).
 */
function inferChoicesFallback(status: QueueStatusResponse): DecisionChoice[] {
  const quantity = status.quantity ?? 0;
  const grantableNow = status.grantableNow ?? 0;
  const canWait = status.optimisticMax == null || status.optimisticMax >= quantity;
  const choices: DecisionChoice[] = [];
  if (canWait) choices.push("WAIT");
  if (grantableNow > 0) choices.push("PARTIAL");
  choices.push("GIVE_UP");
  return choices;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

/** 실시간 폴링 중임을 절제되게 신호하는 펄스 닷(DropStatusPill 의 live 인디케이터와 동일 패턴). */
function LivePulseDot() {
  return (
    <span className="relative flex size-1.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
      <span className="relative inline-flex size-1.5 rounded-full bg-live" />
    </span>
  );
}

type QueueWaitingDialogProps = {
  dropId: string;
  productName: string;
  initialStatus: QueueStatusResponse;
  /** READY 로 전환되어 입장권 발급이 확인되면 호출(부모가 실제 주문 생성을 이어서 진행). */
  onAdmitted: (quantity: number) => void;
  onClose: () => void;
};

/**
 * 대기열(hot drop) 진입 이후의 대기/결정/결과 화면을 한 모달에서 처리한다.
 * WAITING·DECISION_REQUIRED 동안만 폴링하고, READY 에 도달하면 즉시 부모에게 알린 뒤 스스로 닫힌다.
 */
export function QueueWaitingDialog({
  dropId,
  productName,
  initialStatus,
  onAdmitted,
  onClose,
}: QueueWaitingDialogProps) {
  const [status, setStatus] = useState(initialStatus);
  const admittedRef = useRef(false);
  const isPolling = status.status === "WAITING" || status.status === "DECISION_REQUIRED";
  const statusQuery = useQueueStatus(dropId, isPolling);
  const decideMutation = useDecideQueue();

  // 폴링 결과를 화면 상태에 반영(v5는 useQuery에 onSuccess 콜백이 없어 data 변화를 직접 구독).
  useEffect(() => {
    if (statusQuery.data) {
      setStatus(statusQuery.data);
    }
  }, [statusQuery.data]);

  // READY 전환 감지 → 부모(주문 생성)에게 1회만 통지.
  useEffect(() => {
    if (status.status === "READY" && typeof status.quantity === "number" && !admittedRef.current) {
      admittedRef.current = true;
      onAdmitted(status.quantity);
    }
  }, [status, onAdmitted]);

  function decide(choice: DecisionChoice) {
    decideMutation.mutate({ dropId, choice }, { onSuccess: setStatus });
  }

  const busy = decideMutation.isPending;

  return (
    <Dialog open onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent
        className="gap-6"
        // READY 전환 자동 진행 중에는 실수로 닫히지 않도록 바깥 클릭/ESC 를 막는다.
        onInteractOutside={(event) => {
          if (status.status === "READY") event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (status.status === "READY") event.preventDefault();
        }}
      >
        <DialogHeader className="gap-1.5">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Queue</p>
          <DialogTitle>{headerFor(status.status, status.soldOutReason)}</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        {status.status === "WAITING" ? (
          <WaitingPanel status={status} onLeave={() => decide("GIVE_UP")} leaving={busy} />
        ) : null}

        {status.status === "DECISION_REQUIRED" ? (
          <DecisionPanel
            status={status}
            onDecide={decide}
            pending={decideMutation.variables?.choice}
            busy={busy}
          />
        ) : null}

        {status.status === "READY" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-8 text-live" aria-hidden="true" />
            <p className="font-medium text-sm">
              입장 완료 · 주문 {numberFormatter.format(status.quantity ?? 0)}개 처리 중…
            </p>
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : null}

        {status.status === "SOLD_OUT" ? (
          <TerminalPanel message={soldOutMessageFor(status.soldOutReason)} onClose={onClose} />
        ) : null}

        {status.status === "NOT_IN_QUEUE" ? (
          <TerminalPanel
            message="대기열에서 나갔어요. 다시 시도하려면 주문하기를 눌러주세요."
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function headerFor(
  status: QueueStatusResponse["status"],
  soldOutReason: string | null | undefined,
): string {
  switch (status) {
    case "WAITING":
      return "대기 중이에요";
    case "DECISION_REQUIRED":
      return "선택이 필요해요";
    case "READY":
      return "입장 완료";
    case "SOLD_OUT":
      return soldOutReason === "STOCK_EXHAUSTED" ? "재고가 소진됐어요" : "드롭이 마감됐어요";
    case "NOT_IN_QUEUE":
      return "대기열에서 나갔어요";
  }
}

/** SOLD_OUT 본문 문구 — BE가 마감 시각 경과("CLOSED")와 확정 재고 소진("STOCK_EXHAUSTED")을
 * 구분해 내려주므로, "재고가 소진됐다"는 요구를 정확한 문구로 표현한다. 값이 없으면(구버전 BE
 * 호환) 기존의 일반적인 "마감" 문구로 저하한다. */
function soldOutMessageFor(soldOutReason: string | null | undefined): string {
  if (soldOutReason === "STOCK_EXHAUSTED") {
    return "재고가 모두 소진됐어요. 다음 기회에 만나요.";
  }
  return "아쉽게도 대기 중 드롭이 마감됐어요. 다음 기회에 만나요.";
}

function WaitingPanel({
  status,
  onLeave,
  leaving,
}: {
  status: QueueStatusResponse;
  onLeave: () => void;
  leaving: boolean;
}) {
  const rank = typeof status.rank === "number" ? status.rank + 1 : null;
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-center gap-8 rounded-xl border border-border bg-surface/50 py-6">
        <div className="flex flex-col items-center">
          <span className="font-semibold text-4xl text-foreground leading-none tabular-nums">
            {rank !== null ? numberFormatter.format(rank) : "—"}
          </span>
          <span className="mt-2 text-[0.65rem] text-muted-foreground uppercase tracking-[0.15em]">
            내 순번
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-4xl text-muted-foreground leading-none tabular-nums">
            {status.totalWaiting != null ? numberFormatter.format(status.totalWaiting) : "—"}
          </span>
          <span className="mt-2 text-[0.65rem] text-muted-foreground uppercase tracking-[0.15em]">
            전체 대기
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
        <LivePulseDot />
        <span>실시간으로 순번을 확인하고 있어요 · 곧 입장하면 자동으로 진행돼요</span>
      </div>

      <Button variant="ghost" size="sm" className="w-full" onClick={onLeave} disabled={leaving}>
        {leaving ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> 처리 중…
          </span>
        ) : (
          "대기열 나가기"
        )}
      </Button>
    </div>
  );
}

function DecisionPanel({
  status,
  onDecide,
  pending,
  busy,
}: {
  status: QueueStatusResponse;
  onDecide: (choice: DecisionChoice) => void;
  pending: DecisionChoice | undefined;
  busy: boolean;
}) {
  const quantity = status.quantity ?? 0;
  const grantableNow = status.grantableNow ?? 0;
  // 선택지는 BE 가 권위 있게 내려준다(예: grantableNow=0 이면 PARTIAL 이 빠져서 온다 -
  // "0개 부분구매"라는 무의미한 선택지를 클라이언트가 자체 추론으로 만들어내지 않기 위함).
  // 구버전 BE(필드 없음) 에서만 기존 클라이언트측 추론으로 폴백한다.
  const choices = status.availableChoices ?? inferChoicesFallback(status);
  const canWait = choices.includes("WAIT");
  const canPartial = choices.includes("PARTIAL");
  const countdown = useDeadlineCountdownSeconds(status.decisionDeadlineEpochMs);

  return (
    <div className="space-y-5">
      <dl className="space-y-2 rounded-xl border border-border bg-surface/50 p-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">요청 수량</dt>
          <dd className="tabular-nums">{numberFormatter.format(quantity)}개</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">지금 바로 받을 수 있는 수량</dt>
          <dd className="font-medium tabular-nums">{numberFormatter.format(grantableNow)}개</dd>
        </div>
        {status.optimisticMax != null ? (
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">계속 기다리면(최대)</dt>
            <dd className="tabular-nums">{numberFormatter.format(status.optimisticMax)}개</dd>
          </div>
        ) : null}
      </dl>

      {/* 무응답 이탈 처리 카운트다운 — 엄격한 FIFO 에서 맨 앞 사람의 미결정은 전체 대기열을
          정지시키므로, 응답 없이 방치되면 이 시간 뒤 대기열에서 제외된다는 걸 미리 알린다. */}
      {countdown != null ? (
        // "진행중/마감 임박" 신호 전용 --live 토큰 재사용(globals.css) - 새 색 토큰 추가 없이
        // 기존 디자인 시스템의 절제된 경고색 관례를 그대로 따른다.
        <p
          className="rounded-lg border border-live/30 bg-live/10 px-3 py-2 text-center text-live text-xs"
          role="status"
          aria-live="polite"
        >
          ⏰ {countdown}초 내 선택하지 않으면 대기열에서 제외돼요
        </p>
      ) : null}

      <div className="grid gap-2">
        {canWait ? (
          <DecisionButton
            label="계속 기다릴게요"
            variant="default"
            busy={busy}
            isPending={pending === "WAIT"}
            onClick={() => onDecide("WAIT")}
          />
        ) : null}
        {canPartial ? (
          <DecisionButton
            label={`지금 ${numberFormatter.format(grantableNow)}개만 받을게요`}
            variant={canWait ? "outline" : "default"}
            busy={busy}
            isPending={pending === "PARTIAL"}
            onClick={() => onDecide("PARTIAL")}
          />
        ) : null}
        <DecisionButton
          label="포기할게요"
          variant="ghost"
          busy={busy}
          isPending={pending === "GIVE_UP"}
          onClick={() => onDecide("GIVE_UP")}
        />
      </div>
    </div>
  );
}

function DecisionButton({
  label,
  variant,
  busy,
  isPending,
  onClick,
}: {
  label: string;
  variant: "default" | "outline" | "ghost";
  busy: boolean;
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={variant}
      disabled={busy}
      onClick={onClick}
      className={cn(isPending && "opacity-80")}
    >
      {isPending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" /> 처리 중…
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

function TerminalPanel({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="space-y-5 py-2 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button variant="outline" className="w-full" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}

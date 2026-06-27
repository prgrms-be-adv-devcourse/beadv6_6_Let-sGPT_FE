import { cn } from "@/shared/lib/utils";
import type { DropStatus } from "../model/drop.schema";

const STATUS_LABEL: Record<DropStatus, string> = {
  REGISTERED: "오픈 예정",
  OPEN: "진행중",
  CLOSE: "종료",
  SOLD_OUT: "매진",
};

const DOT_TONE: Record<DropStatus, string> = {
  OPEN: "bg-live",
  REGISTERED: "bg-foreground",
  CLOSE: "bg-muted-foreground/40",
  SOLD_OUT: "bg-muted-foreground/40",
};

const TEXT_TONE: Record<DropStatus, string> = {
  OPEN: "text-foreground",
  REGISTERED: "text-foreground",
  CLOSE: "text-muted-foreground",
  SOLD_OUT: "text-muted-foreground",
};

/**
 * 드롭 상태 인디케이터 — 배경 없는 미니멀 닷 + 라벨(에디토리얼).
 * 진행중(OPEN)만 live 컬러의 펄스 닷으로 "지금 라이브"를 절제되게 신호.
 */
export function DropStatusPill({ status, className }: { status: DropStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 font-medium text-xs",
        TEXT_TONE[status],
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {status === "OPEN" ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
        ) : null}
        <span className={cn("relative inline-flex size-1.5 rounded-full", DOT_TONE[status])} />
      </span>
      {STATUS_LABEL[status]}
    </span>
  );
}

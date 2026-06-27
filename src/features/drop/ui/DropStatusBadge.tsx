import { cn } from "@/shared/lib/utils";
import type { DropStatus } from "../model/drop.schema";

const STATUS_LABEL: Record<DropStatus, string> = {
  REGISTERED: "오픈 예정",
  OPEN: "진행중",
  CLOSE: "종료",
  SOLD_OUT: "매진",
};

/** 드롭 상태 태그. 진행중(OPEN)은 live 컬러의 펄스 점으로 "지금 라이브"를 신호한다. */
export function DropStatusBadge({ status, className }: { status: DropStatus; className?: string }) {
  const isLive = status === "OPEN";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-background/80 px-2.5 py-1 font-medium text-foreground text-xs backdrop-blur",
        status === "SOLD_OUT" && "text-muted-foreground",
        className,
      )}
    >
      {isLive ? (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-live" />
        </span>
      ) : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

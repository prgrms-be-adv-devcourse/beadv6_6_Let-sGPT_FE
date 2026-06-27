import { cn } from "@/shared/lib/utils";
import type { DropStatus } from "../model/drop.schema";

const STATUS_META: Record<DropStatus, { label: string; className: string }> = {
  REGISTERED: { label: "오픈 예정", className: "bg-secondary text-secondary-foreground" },
  OPEN: { label: "진행중", className: "bg-primary text-primary-foreground" },
  CLOSE: { label: "종료", className: "bg-muted text-muted-foreground" },
  SOLD_OUT: { label: "매진", className: "bg-destructive text-white" },
};

export function DropStatusBadge({ status }: { status: DropStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-medium text-xs",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

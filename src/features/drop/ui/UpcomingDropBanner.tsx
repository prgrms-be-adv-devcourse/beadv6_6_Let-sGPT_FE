import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { useUpcomingDrops } from "../api/drops.queries";

/** 한정판 오픈 예정 배너 — 가장 가까운 예정 드롭 1건을 강조. */
export function UpcomingDropBanner() {
  const { data } = useUpcomingDrops();
  const nextDrop = data?.content[0];

  return (
    <div className="rounded-xl border bg-muted/40 p-6">
      <p className="font-medium text-muted-foreground text-sm">한정판 오픈 예정</p>
      {nextDrop ? (
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-semibold text-lg">{nextDrop.productName}</span>
          <span>{formatKrw(nextDrop.dropPrice)}</span>
          <span className="text-muted-foreground text-sm">
            {formatDateTime(nextDrop.openAt)} 오픈
          </span>
        </div>
      ) : (
        <p className="mt-1 text-muted-foreground">예정된 드롭이 없습니다.</p>
      )}
    </div>
  );
}

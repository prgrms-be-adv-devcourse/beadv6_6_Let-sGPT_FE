import { cn } from "@/shared/lib/utils";

const numberFormatter = new Intl.NumberFormat("ko-KR");

/** 마감 임박 기준(남은 비율). 이하이면 live 컬러로 긴박감을 준다. */
const LOW_STOCK_RATIO = 0.15;

/**
 * 드롭 재고 진행바. 판매율(=판매분/총량)을 가는 바로, 남은 수량을 숫자로 보여준다.
 * 남은 비율이 낮으면 "마감 임박"을 live 컬러로 강조.
 */
export function StockBar({ remaining, total }: { remaining: number; total: number }) {
  const safeTotal = Math.max(total, 1);
  const remainingRatio = Math.min(Math.max(remaining / safeTotal, 0), 1);
  const soldPercent = Math.round((1 - remainingRatio) * 100);
  const isLow = remaining > 0 && remainingRatio <= LOW_STOCK_RATIO;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span
          className={cn("tabular-nums text-muted-foreground", isLow && "font-medium text-live")}
        >
          {isLow ? "마감 임박 · " : ""}남은 {numberFormatter.format(remaining)}
          <span className="text-muted-foreground"> / {numberFormatter.format(total)}</span>
        </span>
        <span className="tabular-nums text-muted-foreground">{soldPercent}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-foreground", isLow && "bg-live")}
          style={{ width: `${soldPercent}%` }}
        />
      </div>
    </div>
  );
}

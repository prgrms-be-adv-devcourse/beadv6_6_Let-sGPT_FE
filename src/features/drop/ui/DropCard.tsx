import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import type { DropCard as DropCardModel } from "../model/drop.schema";
import { DropStatusPill } from "./DropStatusPill";
import { StockBar } from "./StockBar";

/** 드롭 1건을 표현하는 이미지 우선 에디토리얼 카드(데이터 페칭 없음). */
export function DropCard({ drop }: { drop: DropCardModel }) {
  const showStock = drop.status === "OPEN" || drop.status === "SOLD_OUT";
  const showOpenAt = drop.status === "REGISTERED";

  return (
    <article data-testid="drop-card" className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <ImagePlaceholder name={drop.productName} src={drop.thumbnailKey} />
        </div>
        <span className="absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-1 backdrop-blur">
          <DropStatusPill status={drop.status} />
        </span>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <div className="space-y-1">
          <h3 className="line-clamp-1 font-medium text-base leading-snug">{drop.productName}</h3>
          <p className="font-medium tabular-nums">{formatKrw(drop.dropPrice)}</p>
        </div>
        {showOpenAt ? (
          <p className="mt-auto text-muted-foreground text-sm">
            {formatDateTime(drop.openAt)} 오픈
          </p>
        ) : null}
        {showStock ? (
          <div className="mt-auto">
            <StockBar remaining={drop.remainingQuantity} total={drop.totalQuantity} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

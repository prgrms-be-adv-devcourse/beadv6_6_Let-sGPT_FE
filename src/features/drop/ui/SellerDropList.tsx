import { Link } from "@tanstack/react-router";

import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { LoadingState } from "@/shared/ui/LoadingState";
import { useMyDrops } from "../api/drops.queries";
import { DropCreateDialog } from "./DropCreateDialog";
import { DropStatusPill } from "./DropStatusPill";

/** 판매자 본인 드롭 목록 — 드롭 관리(마이페이지 탭). BE `/api/v1/drops/me`. 등록은 여기서 "드롭 추가"로. */
export function SellerDropList({ sellerInfoId }: { sellerInfoId: string }) {
  const drops = useMyDrops(sellerInfoId, { page: 0, size: 50 });
  const myDrops = drops.data?.content ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DropCreateDialog sellerInfoId={sellerInfoId} />
      </div>

      {drops.isPending ? (
        <LoadingState label="드롭을 불러오는 중" />
      ) : myDrops.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground text-sm">등록된 드롭이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border border-border border-y">
          {myDrops.map((drop) => (
            <li key={drop.id}>
              <Link
                to="/drops/$id"
                params={{ id: drop.id }}
                className="-mx-2 flex items-center gap-4 rounded-md px-2 py-4 transition-colors hover:bg-surface"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-md border">
                  <ImagePlaceholder name={drop.productName} src={drop.thumbnailKey} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium">{drop.productName}</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {drop.status === "REGISTERED"
                      ? `${formatDateTime(drop.openAt)} 오픈`
                      : `남은 ${drop.remainingQuantity} / ${drop.totalQuantity}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="font-medium tabular-nums">{formatKrw(drop.dropPrice)}</span>
                  <DropStatusPill status={drop.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

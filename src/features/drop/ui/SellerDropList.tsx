import { Link } from "@tanstack/react-router";

import { useMyProducts } from "@/features/product/api/products.queries";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { useDropList } from "../api/drops.queries";
import { DropStatusPill } from "./DropStatusPill";

// TODO(fe-api): 판매자 본인 드롭 목록 조회 미지원 → 내 상품 id 로 드롭을 필터(provisional).
//   GET /api/v1/seller/drops(또는 drops?sellerId) 필요. [screens/12-13]
/** 판매자 본인 드롭 목록 — 드롭 관리(마이페이지 탭). 새 드롭 등록은 상품 관리 상세에서. */
export function SellerDropList() {
  const products = useMyProducts({ page: 0, size: 50 });
  const drops = useDropList({ size: 50 });

  const myProductIds = new Set((products.data?.content ?? []).map((product) => product.id));
  const myDrops = (drops.data?.content ?? []).filter((drop) => myProductIds.has(drop.productId));

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        새 드롭은 <span className="text-foreground">상품 관리</span>에서 상품을 선택해 등록합니다.
      </p>

      {drops.isPending || products.isPending ? (
        <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</p>
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

import { Link } from "@tanstack/react-router";

import { formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { useMyProducts } from "../api/products.queries";

/** 판매자 본인 상품 목록 — 상품 관리(마이페이지 탭 / 판매자 콘솔 공용). */
export function SellerProductList() {
  const products = useMyProducts({ page: 0, size: 50 });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link to="/seller/products/new">새 상품 등록</Link>
        </Button>
      </div>

      {products.isPending ? (
        <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</p>
      ) : products.isError ? (
        <p className="py-16 text-center text-destructive text-sm">상품을 불러오지 못했습니다.</p>
      ) : products.data.content.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground text-sm">등록된 상품이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border border-border border-y">
          {products.data.content.map((product) => (
            <li key={product.id}>
              <Link
                to="/seller/products/$id"
                params={{ id: product.id }}
                className="-mx-2 flex items-center gap-4 rounded-md px-2 py-4 transition-colors hover:bg-surface"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-md border">
                  <ImagePlaceholder name={product.name} src={product.thumbnailKey} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {product.categoryName ?? "미분류"}
                  </p>
                </div>
                <span className="shrink-0 font-medium tabular-nums">
                  {product.price === null ? "가격 미정" : formatKrw(product.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { formatKrw } from "@/shared/lib/format";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import type { Product } from "../model/product.schema";

/** 상품 1건을 표현하는 이미지 우선 에디토리얼 카드(데이터 페칭 없음). */
export function ProductCard({ product }: { product: Product }) {
  return (
    <article data-testid="product-card" className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <ImagePlaceholder name={product.name} src={product.thumbnailKey} />
        </div>
      </div>
      <div className="mt-4 space-y-1">
        {product.categoryName ? (
          <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
            {product.categoryName}
          </p>
        ) : null}
        <h3 className="line-clamp-1 font-medium text-base leading-snug">{product.name}</h3>
        <p className="font-medium tabular-nums">
          {product.price === null ? (
            <span className="text-muted-foreground">가격 미정</span>
          ) : (
            formatKrw(product.price)
          )}
        </p>
      </div>
    </article>
  );
}

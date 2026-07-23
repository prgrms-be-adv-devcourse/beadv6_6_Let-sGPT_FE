import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import { formatKrw } from "@/shared/lib/format";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { Tag } from "@/shared/ui/Tag";
import type { Product } from "../model/product.schema";

/** 상품 1건을 표현하는 이미지 우선 에디토리얼 카드(데이터 페칭 없음). */
export function ProductCard({ product }: { product: Product }) {
  return (
    <article data-testid="product-card" className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <ImagePlaceholder name={product.name} src={product.thumbnailKey} />
        </div>
        <WishlistButton productId={product.id} className="absolute top-1.5 right-1.5 z-10" />
      </div>
      <div className="mt-4 space-y-1">
        {product.categoryName ? <Tag>{product.categoryName}</Tag> : null}
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

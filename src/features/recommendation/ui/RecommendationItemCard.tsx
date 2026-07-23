import { BrandLink } from "@/features/product/ui/BrandLink";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import { formatKrw } from "@/shared/lib/format";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import type { RecommendationItem } from "../model/recommendation.schema";

/**
 * 추천 상품 1건 카드(이미지 우선, 데이터 페칭 없음) — ProductCard 스타일 정렬.
 * `compact`(상세 하단 한 줄 추천): 작은 카드 + 가격 숨김. 이 도메인에서 실제 판매가는
 * 상품이 아니라 드롭에 종속(dropPrice)이라, 상품 추천 카드에선 가격을 노출하지 않는다.
 */
export function RecommendationItemCard({
  item,
  compact = false,
}: {
  item: RecommendationItem;
  compact?: boolean;
}) {
  return (
    <article data-testid="recommendation-card" className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <ImagePlaceholder name={item.name} src={item.thumbnailUrl ?? null} />
        </div>
        <WishlistButton
          productId={item.productId}
          className={
            compact ? "absolute top-1 right-1 z-10 size-7" : "absolute top-1.5 right-1.5 z-10"
          }
        />
      </div>
      <div className={compact ? "mt-2 space-y-0.5" : "mt-4 space-y-1"}>
        {item.sellerName ? (
          <BrandLink
            sellerName={item.sellerName}
            className="block max-w-full truncate text-muted-foreground text-xs tracking-[0.06em]"
          />
        ) : null}
        <h3
          className={
            compact
              ? "line-clamp-1 font-medium text-xs leading-snug"
              : "line-clamp-1 font-medium text-base leading-snug"
          }
        >
          {item.name}
        </h3>
        {compact ? null : (
          <p className="font-medium tabular-nums">
            {item.price === null || item.price === undefined ? (
              <span className="text-muted-foreground">가격 미정</span>
            ) : (
              formatKrw(item.price)
            )}
          </p>
        )}
      </div>
    </article>
  );
}

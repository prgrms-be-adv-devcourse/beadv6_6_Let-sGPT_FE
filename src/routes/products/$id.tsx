import { createFileRoute, Link } from "@tanstack/react-router";

import { useDropList } from "@/features/drop/api/drops.queries";
import { DropStatusPill } from "@/features/drop/ui/DropStatusPill";
import { useProduct } from "@/features/product/api/products.queries";
import { BrandLink } from "@/features/product/ui/BrandLink";
import { RecommendationSections } from "@/features/recommendation/ui/RecommendationSections";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { buildGallery } from "@/shared/lib/image";
import { ImageGallery } from "@/shared/ui/ImageGallery";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Tag } from "@/shared/ui/Tag";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const product = useProduct(id);
  const dropList = useDropList();

  if (product.isPending) {
    return <LoadingState label="상품을 불러오는 중" />;
  }
  if (product.isError || !product.data) {
    return (
      <p className="py-16 text-center text-destructive text-sm">상품을 불러오지 못했습니다.</p>
    );
  }

  const item = product.data;
  const relatedDrops = (dropList.data?.content ?? []).filter((drop) => drop.productId === item.id);

  return (
    <div className="space-y-20 sm:space-y-28">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ImageGallery images={buildGallery(item.thumbnailKey, item.imageKeys)} name={item.name} />
        </div>

        <div className="space-y-6">
          {/* 커머스 상세 통상 순서: 브랜드 → 상품명 → 가격 */}
          <div className="space-y-3">
            {item.sellerName ? (
              <BrandLink
                sellerName={item.sellerName}
                className="text-muted-foreground text-sm tracking-[0.08em]"
              />
            ) : null}
            <h1 className="font-serif text-4xl leading-tight tracking-tight">{item.name}</h1>
            <p className="font-medium text-2xl tabular-nums">
              {item.price === null ? (
                <span className="text-lg text-muted-foreground">가격 미정</span>
              ) : (
                formatKrw(item.price)
              )}
            </p>
          </div>

          {/* 메타(카테고리) + 액션(찜) — 브랜드와 분리해 한 줄에 두지 않음 */}
          <div className="flex items-center gap-4 border-border border-t border-b py-4">
            {item.categoryName ? <Tag>{item.categoryName}</Tag> : null}
            <WishlistButton productId={item.id} variant="detail" className="ml-auto" />
          </div>

          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
            {item.description}
          </p>

          <dl className="grid grid-cols-[6rem_1fr] gap-y-2 border-border border-t pt-6 text-sm">
            <dt className="text-muted-foreground">등록일</dt>
            <dd className="tabular-nums">{formatDateTime(item.createdAt)}</dd>
          </dl>

          <section className="space-y-3 border-border border-t pt-6">
            <h2 className="font-medium text-sm">드롭 이력</h2>
            {relatedDrops.length === 0 ? (
              <p className="text-muted-foreground text-sm">이 상품의 드롭이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {relatedDrops.map((drop) => (
                  <li key={drop.id}>
                    <Link
                      to="/drops/$id"
                      params={{ id: drop.id }}
                      className="flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm transition-colors hover:bg-surface"
                    >
                      <span className="flex items-center gap-2">
                        <DropStatusPill status={drop.status} />
                        <span className="tabular-nums">{formatKrw(drop.dropPrice)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {formatDateTime(drop.openAt)} 오픈 →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <RecommendationSections
        productId={item.id}
        eyebrow="You May Also Like · 함께 보면 좋은"
        heading="이 상품과 어울리는 추천"
        compact
      />
    </div>
  );
}

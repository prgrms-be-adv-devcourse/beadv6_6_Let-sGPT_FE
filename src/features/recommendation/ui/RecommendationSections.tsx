import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { LoadingState } from "@/shared/ui/LoadingState";
import { useHomeRecommendations, useProductRecommendations } from "../api/recommendations.queries";
import type { RecommendationSection } from "../model/recommendation.schema";
import { RecommendationItemCard } from "./RecommendationItemCard";

function Message({ children }: { children: ReactNode }) {
  return <p className="py-10 text-muted-foreground text-sm">{children}</p>;
}

/**
 * 개인화 추천 영역 — 홈(productId 없음)과 상품 상세(productId) 공용.
 * 섹션마다 한국어 제목 + 상품 카드. 로딩(콜드 10~15초)/에러/빈 결과를 모두 처리한다.
 * `compact`(상세 하단): 작은 카드 + 가로 한 줄(스크롤). 기본(홈): 카드 그리드.
 */
export function RecommendationSections({
  productId,
  eyebrow = "For You · 추천",
  heading = "당신을 위한 추천",
  compact = false,
}: {
  productId?: string;
  eyebrow?: string;
  heading?: string;
  compact?: boolean;
}) {
  // 홈/상세에서 훅이 조건 없이 항상 한 개만 호출되도록 분기(rules-of-hooks 준수).
  const home = useHomeRecommendations();
  const detail = useProductRecommendations(productId ?? "");
  const query = productId ? detail : home;
  const { data, isPending, isError } = query;

  const sections: RecommendationSection[] = (data?.sections ?? []).filter(
    (section) => section.products.length > 0,
  );

  return (
    <section className={compact ? "space-y-6" : "space-y-8"}>
      <div className="border-border border-b pb-5">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">{eyebrow}</p>
        <h2
          className={
            compact
              ? "mt-2 font-serif text-2xl tracking-tight"
              : "mt-2 font-serif text-3xl tracking-tight sm:text-4xl"
          }
        >
          {heading}
        </h2>
      </div>

      {isPending ? <LoadingState label="추천을 준비하는 중" className="py-10" /> : null}
      {isError ? <Message>추천을 불러오지 못했습니다.</Message> : null}
      {data && sections.length === 0 ? <Message>아직 추천할 상품이 없습니다.</Message> : null}

      {sections.map((section) => (
        <div key={section.title} className={compact ? "space-y-3" : "space-y-5"}>
          <h3
            className={
              compact ? "font-medium text-muted-foreground text-sm" : "font-medium text-lg"
            }
          >
            {section.title}
          </h3>
          {compact ? (
            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
              {section.products.map((item) => (
                <Link
                  key={item.productId}
                  to="/products/$id"
                  params={{ id: item.productId }}
                  className="block w-28 shrink-0 sm:w-32"
                >
                  <RecommendationItemCard item={item} compact />
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {section.products.map((item) => (
                <Link
                  key={item.productId}
                  to="/products/$id"
                  params={{ id: item.productId }}
                  className="block"
                >
                  <RecommendationItemCard item={item} />
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

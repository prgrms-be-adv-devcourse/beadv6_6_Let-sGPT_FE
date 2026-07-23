import { queryOptions, useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { getRecommendations } from "./recommendations.api";

/**
 * 추천은 LLM 호출이라 비싸고(콜드 10~15초) 자주 바뀌지 않으므로
 * staleTime 을 길게(5분) 잡아 재요청을 줄인다. 실패 재시도는 전역(retry:1)을 따른다.
 *
 * ⚠️ 개인화는 회원별로 달라지므로 **쿼리 키에 memberId 를 포함**한다(비로그인="anon").
 * 이게 없으면 익명 폴백이 캐싱된 뒤 로그인/계정전환해도 같은 키+미경과 staleTime 로
 * refetch 되지 않아 전부 익명 폴백이 표시된다(캐시 오염).
 */
export const recommendationQueries = {
  home: (memberId: string) =>
    queryOptions({
      queryKey: ["recommendations", "home", memberId] as const,
      queryFn: () => getRecommendations(),
      staleTime: 5 * 60_000,
    }),
  forProduct: (productId: string, memberId: string) =>
    queryOptions({
      queryKey: ["recommendations", "product", productId, memberId] as const,
      queryFn: () => getRecommendations(productId),
      staleTime: 5 * 60_000,
    }),
};

/** 홈 개인화 추천. 로그인/계정전환 시 memberId 키가 바뀌어 자동 refetch → 개인화 반영. */
export function useHomeRecommendations() {
  const memberId = useAuthStore((state) => state.member?.id ?? "anon");
  return useQuery(recommendationQueries.home(memberId));
}

/** 상품 상세 "함께 보면 좋은" 추천. 회원 개인화가 섞일 수 있어 memberId 도 키에 포함. */
export function useProductRecommendations(productId: string) {
  const memberId = useAuthStore((state) => state.member?.id ?? "anon");
  return useQuery(recommendationQueries.forProduct(productId, memberId));
}

import { apiFetch } from "@/shared/api/http";
import { type Recommendations, recommendationsSchema } from "../model/recommendation.schema";

/**
 * 개인화 추천 조회(GET /api/v1/recommendations).
 * - 공개 엔드포인트(비회원 GET 허용) — 회원이면 apiFetch 가 Authorization 을 자동 주입해
 *   개인화 신호를 반영, 없으면 폴백 섹션이 온다.
 * - `productId` 를 주면 상품 상세용 "함께 보면 좋은" 추천(0~1그룹).
 * - 콜드/LLM 지연으로 10~15초 걸릴 수 있음 — 호출부는 로딩 상태를 처리한다.
 */
export function getRecommendations(productId?: string): Promise<Recommendations> {
  return apiFetch("/api/v1/recommendations", recommendationsSchema, {
    query: { productId },
  });
}

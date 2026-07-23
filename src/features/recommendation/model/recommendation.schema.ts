import { z } from "zod";

/**
 * 신뢰 경계(§6.1) 런타임 스키마 — BE 개인화 추천 응답과 일치.
 * `GET /api/v1/recommendations` → `{ sections: [{ title, products: [...] }] }`.
 * 비로그인/신호없음/실패 시 폴백(섹션 없음 또는 빈 products)일 수 있어 관대하게 좁힌다.
 */
export const recommendationItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sellerName: z.string().nullish(),
  price: z.number().nullish(),
  thumbnailUrl: z.string().nullish(),
});
export type RecommendationItem = z.infer<typeof recommendationItemSchema>;

export const recommendationSectionSchema = z.object({
  title: z.string(),
  products: z.array(recommendationItemSchema),
});
export type RecommendationSection = z.infer<typeof recommendationSectionSchema>;

export const recommendationsSchema = z.object({
  sections: z.array(recommendationSectionSchema),
});
export type Recommendations = z.infer<typeof recommendationsSchema>;

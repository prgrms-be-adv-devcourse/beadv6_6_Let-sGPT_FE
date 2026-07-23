import { z } from "zod";
import { pageResponseSchema } from "@/shared/api/pagination";

/**
 * 신뢰 경계(§6.1) 런타임 스키마 — BE 위시리스트 응답과 일치.
 * `GET /api/v1/wishlist` → `PageResponse<WishlistItemResponse>`.
 * BE `WishlistItemResponse` 는 현재 productId 만 담는다(상품 상세는 별도 조회).
 */
export const wishlistItemSchema = z.object({
  productId: z.string(),
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;

export const wishlistPageSchema = pageResponseSchema(wishlistItemSchema);
export type WishlistPage = z.infer<typeof wishlistPageSchema>;

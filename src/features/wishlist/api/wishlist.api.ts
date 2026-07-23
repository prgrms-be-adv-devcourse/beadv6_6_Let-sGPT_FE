import { z } from "zod";

import { apiFetch } from "@/shared/api/http";
import { type WishlistPage, wishlistPageSchema } from "../model/wishlist.schema";

/**
 * 위시리스트(찜) 목록 조회(GET /api/v1/wishlist) — 로그인 필요.
 * 응답은 productId 목록이라, 토글 상태 판별용으로 한 번에 넉넉히 받아 Set 으로 쓴다.
 */
export function getWishlist(params: { page?: number; size?: number } = {}): Promise<WishlistPage> {
  return apiFetch("/api/v1/wishlist", wishlistPageSchema, {
    query: { page: params.page, size: params.size },
  });
}

/**
 * 찜 토글(PUT /api/v1/wishlist/{productId}) — 로그인 필요.
 * body `{ wished }`: true=추가, false=삭제. 응답 본문 없음(200).
 */
export function setWishlist(productId: string, wished: boolean): Promise<void> {
  return apiFetch(`/api/v1/wishlist/${productId}`, z.void(), {
    method: "PUT",
    body: { wished },
  });
}

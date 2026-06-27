import { z } from "zod";

import { apiFetch } from "@/shared/api/http";
import {
  type ProductPage,
  type ProductWriteBody,
  productPageSchema,
} from "../model/product.schema";

// TODO(fe-api): GET /api/v1/products/me -> PageResponse<ProductResponse> (X-User-Id 기준 판매자 본인 상품).
//   BE ProductSearchRequest 에 sellerId 필터가 없어 판매자 콘솔(상품 관리) 목록을 만들 수 없다 → provisional.
//   [screens/12-seller-products]
export function getMyProducts(params: { page?: number; size?: number } = {}): Promise<ProductPage> {
  return apiFetch("/api/v1/products/me", productPageSchema, {
    query: { page: params.page, size: params.size },
  });
}

/** 상품 등록(POST /products) — scoped 토큰 필요. 201+Location, 본문 없음. */
export function createProduct(body: ProductWriteBody, token: string): Promise<void> {
  return apiFetch("/api/v1/products", z.void(), { method: "POST", body, token });
}

/** 상품 수정(PATCH /products/{id}) — scoped 토큰 필요. 204. */
export function updateProduct(id: string, body: ProductWriteBody, token: string): Promise<void> {
  return apiFetch(`/api/v1/products/${id}`, z.void(), { method: "PATCH", body, token });
}

/** 상품 삭제(DELETE /products/{id}) — scoped 토큰 필요. 204(오픈 드롭 있으면 409). */
export function deleteProduct(id: string, token: string): Promise<void> {
  return apiFetch(`/api/v1/products/${id}`, z.void(), { method: "DELETE", token });
}

import { z } from "zod";

import type { SellerAuth } from "@/features/auth/api/auth.api";
import { apiFetch } from "@/shared/api/http";
import {
  type ImageUpload,
  imageUploadSchema,
  type ProductPage,
  type ProductWriteBody,
  productPageSchema,
} from "../model/product.schema";

// 판매자 본인 상품 목록(GET /api/v1/products/me) — BE 구현됨(searchMyProducts, 활성 스토어 기준). [screens/12]
export function getMyProducts(params: { page?: number; size?: number } = {}): Promise<ProductPage> {
  return apiFetch("/api/v1/products/me", productPageSchema, {
    query: { page: params.page, size: params.size },
  });
}

/** 상품 등록(POST /products) — 판매자 토큰 필요. 201+Location, 본문 없음. */
export function createProduct(body: ProductWriteBody, auth: SellerAuth): Promise<void> {
  return apiFetch("/api/v1/products", z.void(), {
    method: "POST",
    body,
    token: auth.token,
    reauth: auth.reauth,
  });
}

/** 상품 수정(PATCH /products/{id}) — 판매자 토큰 필요. 204. */
export function updateProduct(id: string, body: ProductWriteBody, auth: SellerAuth): Promise<void> {
  return apiFetch(`/api/v1/products/${id}`, z.void(), {
    method: "PATCH",
    body,
    token: auth.token,
    reauth: auth.reauth,
  });
}

/** 상품 삭제(DELETE /products/{id}) — 판매자 토큰 필요. 204(오픈 드롭 있으면 409). */
export function deleteProduct(id: string, auth: SellerAuth): Promise<void> {
  return apiFetch(`/api/v1/products/${id}`, z.void(), {
    method: "DELETE",
    token: auth.token,
    reauth: auth.reauth,
  });
}

/**
 * 상품 이미지 업로드(multipart, part 명 `file`) → `{ key, url }`.
 * 반환 key 를 상품 write 의 thumbnailKey·imageKeys 로 사용. 회원 토큰으로 인증(apiFetch 자동 주입).
 */
export function uploadProductImage(file: File): Promise<ImageUpload> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch("/api/v1/products/images", imageUploadSchema, { method: "POST", body: form });
}

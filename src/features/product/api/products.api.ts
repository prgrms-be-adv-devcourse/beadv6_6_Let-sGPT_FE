import { z } from "zod";

import type { SellerAuth } from "@/features/auth/api/auth.api";
import { apiFetch } from "@/shared/api/http";
import {
  type PresignedUpload,
  type ProductPage,
  type ProductWriteBody,
  presignedUploadSchema,
  productPageSchema,
} from "../model/product.schema";

// 판매자 본인 상품 목록(GET /api/v1/products/me) — BE 구현됨(searchMyProducts).
// BE 가 X-Seller-Id(scoped 토큰) 로 스토어를 식별 → 회원 토큰이면 401(UNAUTHENTICATED).
// 따라서 write 와 동일하게 스토어 범위 판매자 토큰을 싣는다.
export function getMyProducts(
  params: { page?: number; size?: number } = {},
  auth: SellerAuth,
): Promise<ProductPage> {
  return apiFetch("/api/v1/products/me", productPageSchema, {
    query: { page: params.page, size: params.size },
    token: auth.token,
    reauth: auth.reauth,
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
 * 이미지 presign 발급(`POST /products/images/presign`) → `{ stagingKey, uploadUrl, expiresAt }`.
 * S3 staging 직행 PUT 을 위한 서명 URL 발급. 발급도 `POST /products/**` 경로라
 * create/update 와 동일하게 판매자 스토어 범위 토큰(SellerAuth)이 필요하다.
 * 저장 키의 확장자는 BE 가 contentType 으로 결정한다 — 파일명은 보내지 않는다.
 */
export function presignProductImage(
  params: { contentType: string },
  auth: SellerAuth,
): Promise<PresignedUpload> {
  return apiFetch("/api/v1/products/images/presign", presignedUploadSchema, {
    method: "POST",
    body: params,
    token: auth.token,
    reauth: auth.reauth,
  });
}

/**
 * presign 으로 받은 uploadUrl 에 파일을 직접 PUT(외부 S3 오리진, 토큰 없음).
 * apiFetch 미사용 — JSON 이 아니고 게이트웨이가 아닌 S3 를 향한다.
 * 헤더는 **Content-Type 하나만** — presign 서명 대상이 key+Content-Type 이라
 * 다른 헤더(Authorization 등)를 추가하면 서명 불일치로 403 이 된다.
 */
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`S3 업로드에 실패했습니다 (${res.status})`);
  }
}

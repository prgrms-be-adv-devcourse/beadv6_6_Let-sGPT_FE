import { z } from "zod";
import { apiFetch } from "@/shared/api/http";
import { type SellerInfo, sellerInfoListSchema, sellerInfoSchema } from "../model/seller.schema";

/** 내 판매자정보 목록(기본 활성만). */
export function getMySellerInfos(params: { isActive?: boolean } = {}): Promise<SellerInfo[]> {
  return apiFetch("/api/v1/seller/me", sellerInfoListSchema, {
    query: { isActive: params.isActive },
  });
}

/** 판매자 등록(USER 도 호출 가능 → 이후 refresh 해야 SELLER 토큰 획득). */
export function createSellerInfo(input: {
  businessNumber: string;
  storeName: string;
}): Promise<SellerInfo> {
  return apiFetch("/api/v1/seller/me", sellerInfoSchema, {
    method: "POST",
    body: input,
  });
}

export function updateSellerInfo(
  sellerId: string,
  input: { storeName: string },
): Promise<SellerInfo> {
  return apiFetch(`/api/v1/seller/me/${sellerId}`, sellerInfoSchema, {
    method: "PATCH",
    body: input,
  });
}

export function deleteSellerInfo(sellerId: string): Promise<void> {
  return apiFetch(`/api/v1/seller/me/${sellerId}`, z.void(), { method: "DELETE" });
}

import { z } from "zod";

import type { SellerAuth } from "@/features/auth/api/auth.api";
import { apiFetch } from "@/shared/api/http";
import {
  type DropCard,
  type DropCardPage,
  type DropCreateBody,
  type DropStatus,
  dropCardPageSchema,
  dropCardSchema,
} from "../model/drop.schema";

// 드롭 목록 조회(GET /api/v1/drops) — BE 구현됨(DropController.searchDrops). 홈(진행중/오픈예정) + 드롭 목록.
//   응답: Drop(dropPrice·totalQuantity·openAt·closeAt·status) + 표시용 product(productName·thumbnailKey·sellerName)
//   + 재고 게이트키퍼의 remainingQuantity. 코드젠 스펙에 잡히기 전까지 apiFetch(경로 직접 + Zod 경계)로 호출. [screens/01·04]

export type FetchDropsParams = {
  status?: DropStatus;
  categoryId?: string;
  keyword?: string;
  sort?: string;
  page?: number;
  size?: number;
};

export function fetchDrops(params: FetchDropsParams = {}): Promise<DropCardPage> {
  // 공개 조회(비로그인 허용) — getDrop 과 동일하게 apiFetch(auth:false)로 통일.
  return apiFetch("/api/v1/drops", dropCardPageSchema, {
    auth: false,
    query: {
      status: params.status,
      categoryId: params.categoryId,
      keyword: params.keyword,
      sort: params.sort,
      page: params.page,
      size: params.size,
    },
  });
}

/**
 * 판매자 본인 드롭 목록(GET /api/v1/drops/me) — BE 구현됨(searchMyDrops). [screens/12·13]
 * BE 가 X-Seller-Id(scoped 토큰) 로 스토어를 식별 → 회원 토큰이면 401 → 스토어 범위 토큰 부착.
 */
export function getMyDrops(params: FetchDropsParams = {}, auth: SellerAuth): Promise<DropCardPage> {
  return apiFetch("/api/v1/drops/me", dropCardPageSchema, {
    query: {
      status: params.status,
      categoryId: params.categoryId,
      keyword: params.keyword,
      sort: params.sort,
      page: params.page,
      size: params.size,
    },
    token: auth.token,
    reauth: auth.reauth,
  });
}

/** 드롭 단건 조회(GET /api/v1/drops/{id}) — BE 구현됨(DropController.getDrop). 공개 조회. */
export function getDrop(id: string): Promise<DropCard> {
  return apiFetch(`/api/v1/drops/${id}`, dropCardSchema, { auth: false });
}

/** 드롭 생성(POST /drops) — 판매자 토큰 필요. 201+Location, 본문 없음. */
export function createDrop(body: DropCreateBody, auth: SellerAuth): Promise<void> {
  return apiFetch("/api/v1/drops", z.void(), {
    method: "POST",
    body,
    token: auth.token,
    reauth: auth.reauth,
  });
}

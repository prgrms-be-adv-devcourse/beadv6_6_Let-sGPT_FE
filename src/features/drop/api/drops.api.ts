import { z } from "zod";

import { apiFetch } from "@/shared/api/http";
import {
  type DropCard,
  type DropCardPage,
  type DropCreateBody,
  type DropStatus,
  dropCardPageSchema,
  dropCardSchema,
} from "../model/drop.schema";

// TODO(fe-api): GET /api/v1/drops?status={REGISTERED|OPEN|CLOSE|SOLD_OUT}&page&size -> PageResponse<DropCardResponse>
//   필요: 홈(진행중/오픈예정) + 드롭 목록 화면. BE DropController 는 POST/DELETE(command)만 → 조회(read) 미구현.
//   응답 가정: Drop(dropPrice·totalQuantity·openAt·closeAt·status) + 표시용 product(productName·thumbnailKey)
//             + 재고 게이트키퍼의 remainingQuantity. [screens/01-home, screens/04-drop-list]
//
// 코드젠 스펙에 위 경로가 없으므로 잠정적으로 fetch 를 직접 쓴다. 게이트웨이에 조회 API가 생기면 apiClient 로 이관.

export type FetchDropsParams = {
  status?: DropStatus;
  categoryId?: string;
  keyword?: string;
  sort?: string;
  page?: number;
  size?: number;
};

export async function fetchDrops(params: FetchDropsParams = {}): Promise<DropCardPage> {
  const url = new URL("/api/v1/drops", import.meta.env.VITE_API_BASE_URL);
  if (params.status) {
    url.searchParams.set("status", params.status);
  }
  if (params.categoryId) {
    url.searchParams.set("categoryId", params.categoryId);
  }
  if (params.keyword) {
    url.searchParams.set("keyword", params.keyword);
  }
  if (params.sort) {
    url.searchParams.set("sort", params.sort);
  }
  if (params.page !== undefined) {
    url.searchParams.set("page", String(params.page));
  }
  if (params.size !== undefined) {
    url.searchParams.set("size", String(params.size));
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`드롭 목록 조회에 실패했습니다 (http=${response.status}).`);
  }
  // 신뢰 경계: 응답을 Zod 로 검증한다(§6.1).
  return dropCardPageSchema.parse(await response.json());
}

// TODO(fe-api): GET /api/v1/drops/{id} 단건 조회도 BE 미구현 → provisional(드롭 상세 화면).
export function getDrop(id: string): Promise<DropCard> {
  return apiFetch(`/api/v1/drops/${id}`, dropCardSchema, { auth: false });
}

/** 드롭 생성(POST /drops) — scoped 토큰 필요. 201+Location, 본문 없음. */
export function createDrop(body: DropCreateBody, token: string): Promise<void> {
  return apiFetch("/api/v1/drops", z.void(), { method: "POST", body, token });
}

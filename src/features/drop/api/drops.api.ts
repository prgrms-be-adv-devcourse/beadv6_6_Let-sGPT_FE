import { type DropCardPage, type DropStatus, dropCardPageSchema } from "../model/drop.schema";

// TODO(fe-api): GET /api/v1/drops?status={REGISTERED|OPEN|CLOSE|SOLD_OUT}&page&size -> PageResponse<DropCardResponse>
//   필요: 홈(진행중/오픈예정) + 드롭 목록 화면. BE DropController 는 POST/DELETE(command)만 → 조회(read) 미구현.
//   응답 가정: Drop(dropPrice·totalQuantity·openAt·closeAt·status) + 표시용 product(productName·thumbnailKey)
//             + 재고 게이트키퍼의 remainingQuantity. [screens/01-home, screens/04-drop-list]
//
// 코드젠 스펙에 위 경로가 없으므로 잠정적으로 fetch 를 직접 쓴다. 게이트웨이에 조회 API가 생기면 apiClient 로 이관.

export type FetchDropsParams = {
  status?: DropStatus;
  page?: number;
  size?: number;
};

export async function fetchDrops(params: FetchDropsParams = {}): Promise<DropCardPage> {
  const url = new URL("/api/v1/drops", import.meta.env.VITE_API_BASE_URL);
  if (params.status) {
    url.searchParams.set("status", params.status);
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

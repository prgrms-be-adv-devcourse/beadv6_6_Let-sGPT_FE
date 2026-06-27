import { type DropCardPage, type DropStatus, dropCardPageSchema } from "../model/drop.schema";

// TODO(fe-api): GET /api/v1/drops?status={OPEN|REGISTERED}&page&size -> PageResponse<DropCardResponse>
//   필요: 홈 화면 "진행중(OPEN) / 오픈 예정(REGISTERED) 드롭 카드 목록".
//   현재 BE 의 DropController 는 POST/DELETE(command)만 노출 → 조회(read)가 없다.
//   응답 가정: Drop(dropPrice·totalQuantity·openAt·closeAt·status) + 표시용 product(productName·thumbnailKey)
//             + 재고 게이트키퍼의 remainingQuantity. [screens/01-home]
//
// 코드젠 스펙에 위 경로가 없으므로(typed apiClient 비대상) 잠정적으로 fetch 를 직접 쓴다.
// 게이트웨이에 조회 API가 생겨 `pnpm codegen` 에 잡히면 apiClient + schema.d.ts 경로로 이관한다.

type DropListParams = {
  page?: number;
  size?: number;
};

export async function fetchDropsByStatus(
  status: DropStatus,
  params: DropListParams = {},
): Promise<DropCardPage> {
  const url = new URL("/api/v1/drops", import.meta.env.VITE_API_BASE_URL);
  url.searchParams.set("status", status);
  if (params.page !== undefined) {
    url.searchParams.set("page", String(params.page));
  }
  if (params.size !== undefined) {
    url.searchParams.set("size", String(params.size));
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`드롭 목록 조회에 실패했습니다 (status=${status}, http=${response.status}).`);
  }
  // 신뢰 경계: 응답을 Zod 로 검증한다(§6.1).
  return dropCardPageSchema.parse(await response.json());
}

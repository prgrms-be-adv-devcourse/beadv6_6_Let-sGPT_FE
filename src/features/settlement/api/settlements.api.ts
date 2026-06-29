import { z } from "zod";

import { apiFetch } from "@/shared/api/http";
import {
  type SellerSettlementPage,
  type SettlementBatchResultPage,
  type SettlementOrderPage,
  sellerSettlementPageSchema,
  settlementBatchResultPageSchema,
  settlementBatchStatusSchema,
  settlementOrderPageSchema,
} from "../model/settlement.schema";

export type SettlementScope = "seller" | "admin";

export type SettlementFilter = {
  settlementMonth?: string;
  status?: string;
  page?: number;
  size?: number;
};

export type SettlementOrderFilter = SettlementFilter & {
  sellerId?: string;
  orderId?: string;
};

export type SettlementBatchResultFilter = Pick<
  SettlementFilter,
  "settlementMonth" | "status" | "page" | "size"
>;

type SettlementQuery = Record<string, string | number | boolean | undefined>;

function toQuery(filter: SettlementFilter): SettlementQuery {
  return {
    settlementMonth: filter.settlementMonth,
    status: filter.status,
    page: filter.page,
    size: filter.size,
  };
}

/** 임시 디버깅: 개발 환경에서 settlement 요청 URL과 실제 전송 파라미터를 확인한다. */
function logSettlementRequest(method: "GET" | "POST", path: string, query: SettlementQuery) {
  if (!import.meta.env.DEV) {
    return;
  }

  const url = new URL(path, import.meta.env.VITE_API_BASE_URL);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  console.info("[settlement API request]", {
    method,
    url: url.toString(),
    params: Object.fromEntries(url.searchParams.entries()),
  });
}

/** 주문 단위 정산 목록(GET /settlements/{scope}/orders). */
export function getSettlementOrders(
  scope: SettlementScope,
  filter: SettlementOrderFilter = {},
): Promise<SettlementOrderPage> {
  const path = `/api/v1/settlements/${scope}/orders`;
  const query = {
    ...toQuery(filter),
    sellerId: filter.sellerId,
    orderId: filter.orderId,
  };
  logSettlementRequest("GET", path, query);

  return apiFetch(path, settlementOrderPageSchema, {
    query,
  });
}

/** 판매자·월 단위 정산 목록(GET /settlements/{scope}/sellers). */
export function getSellerSettlements(
  scope: SettlementScope,
  sellerId: string | undefined,
  filter: SettlementFilter = {},
): Promise<SellerSettlementPage> {
  const path = `/api/v1/settlements/${scope}/sellers`;
  const query = {
    ...toQuery(filter),
    sellerId,
  };
  logSettlementRequest("GET", path, query);

  return apiFetch(path, sellerSettlementPageSchema, {
    query,
  });
}

/** 관리자용 월 자동 정산 배치 결과(GET /settlements/admin/batch-results). */
export function getSettlementBatchResults(
  filter: SettlementBatchResultFilter = {},
): Promise<SettlementBatchResultPage> {
  const path = "/api/v1/settlements/admin/batch-results";
  const query = toQuery(filter);
  logSettlementRequest("GET", path, query);

  return apiFetch(path, settlementBatchResultPageSchema, {
    query,
  });
}

const retryFailedResponseSchema = z.object({
  batchId: z.string().uuid(),
  settlementMonth: z.string().regex(/^\d{6}$/),
  retriedSellerCount: z.number(),
  status: settlementBatchStatusSchema,
  failReason: z.string().nullable(),
});
export type RetryFailedSettlementsResponse = z.infer<typeof retryFailedResponseSchema>;

/** 실패 판매자 정산 재시도(POST /settlements/admin/retry-failed?settlementMonth, ADMIN). */
export function retryFailedSettlements(
  settlementMonth: string,
): Promise<RetryFailedSettlementsResponse> {
  const path = "/api/v1/settlements/admin/retry-failed";
  const query = { settlementMonth };
  logSettlementRequest("POST", path, query);

  return apiFetch(path, retryFailedResponseSchema, {
    method: "POST",
    query,
  });
}

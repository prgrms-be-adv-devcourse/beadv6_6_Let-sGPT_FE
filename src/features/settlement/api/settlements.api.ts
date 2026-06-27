import { z } from "zod";

import { apiFetch } from "@/shared/api/http";
import {
  type SellerSettlementPage,
  type SettlementOrderPage,
  sellerSettlementPageSchema,
  settlementOrderPageSchema,
} from "../model/settlement.schema";

export type SettlementScope = "seller" | "admin";

export type SettlementFilter = {
  settlementMonth?: string;
  status?: string;
  sellerId?: string;
  orderId?: string;
  page?: number;
  size?: number;
};

function toQuery(filter: SettlementFilter): Record<string, string | number | undefined> {
  return {
    settlementMonth: filter.settlementMonth,
    status: filter.status,
    sellerId: filter.sellerId,
    orderId: filter.orderId,
    page: filter.page,
    size: filter.size,
  };
}

/** 주문 단위 정산 목록(GET /settlements/{scope}/orders). */
export function getSettlementOrders(
  scope: SettlementScope,
  filter: SettlementFilter = {},
): Promise<SettlementOrderPage> {
  return apiFetch(`/api/v1/settlements/${scope}/orders`, settlementOrderPageSchema, {
    query: toQuery(filter),
  });
}

/** 판매자·월 단위 정산 목록(GET /settlements/{scope}/sellers). */
export function getSellerSettlements(
  scope: SettlementScope,
  filter: SettlementFilter = {},
): Promise<SellerSettlementPage> {
  return apiFetch(`/api/v1/settlements/${scope}/sellers`, sellerSettlementPageSchema, {
    query: toQuery(filter),
  });
}

const retryFailedResponseSchema = z.object({ retriedCount: z.number() });

/** 실패 판매자 정산 재시도(POST /settlements/admin/retry-failed?settlementMonth, ADMIN). */
export function retryFailedSettlements(settlementMonth: string): Promise<{ retriedCount: number }> {
  return apiFetch("/api/v1/settlements/admin/retry-failed", retryFailedResponseSchema, {
    method: "POST",
    query: { settlementMonth },
  });
}

import { HttpResponse, http } from "msw";

import { sellerSettlements, settlementBatchResults, settlementOrders } from "../data/settlements";

function paginate<T>(list: T[], page: number, size: number) {
  const start = page * size;
  return {
    content: list.slice(start, start + size),
    page,
    size,
    totalElements: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / size)),
  };
}

function pageParams(request: Request) {
  const url = new URL(request.url);
  return {
    settlementMonth: url.searchParams.get("settlementMonth"),
    status: url.searchParams.get("status"),
    sellerId: url.searchParams.get("sellerId"),
    orderId: url.searchParams.get("orderId"),
    page: Number(url.searchParams.get("page") ?? "0"),
    size: Number(url.searchParams.get("size") ?? "10"),
  };
}

// 판매자/관리자 정산 조회. sellerId가 있으면 해당 활성 판매자 범위로 제한한다.
export const settlementHandlers = [
  http.get("*/api/v1/settlements/:scope/orders", ({ request }) => {
    const { settlementMonth, status, sellerId, orderId, page, size } = pageParams(request);
    let filtered = settlementOrders;
    if (settlementMonth) {
      filtered = filtered.filter((order) => order.settlementMonth === settlementMonth);
    }
    if (status) {
      filtered = filtered.filter((order) => order.status === status);
    }
    if (sellerId) {
      filtered = filtered.filter((order) => order.sellerId === sellerId);
    }
    if (orderId) {
      filtered = filtered.filter((order) => order.orderId === orderId);
    }
    return HttpResponse.json(paginate(filtered, page, size));
  }),

  http.get("*/api/v1/settlements/:scope/sellers", ({ request }) => {
    const { settlementMonth, status, sellerId, page, size } = pageParams(request);
    let filtered = sellerSettlements;
    if (settlementMonth) {
      filtered = filtered.filter((item) => item.settlementMonth === settlementMonth);
    }
    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }
    if (sellerId) {
      filtered = filtered.filter((item) => item.sellerId === sellerId);
    }
    return HttpResponse.json(paginate(filtered, page, size));
  }),

  http.get("*/api/v1/settlements/admin/batch-results", ({ request }) => {
    const { settlementMonth, status, page, size } = pageParams(request);
    let filtered = settlementBatchResults;
    if (settlementMonth) {
      filtered = filtered.filter((item) => item.settlementMonth === settlementMonth);
    }
    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }
    return HttpResponse.json(paginate(filtered, page, size));
  }),

  http.post("*/api/v1/settlements/admin/retry-failed", ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get("settlementMonth");
    let retried = 0;
    for (const item of sellerSettlements) {
      if (item.status === "FAILED" && (!month || item.settlementMonth === month)) {
        item.status = "COMPLETED";
        item.failReason = null;
        item.failedAt = null;
        item.completedAt = "2026-06-27T04:00:00";
        retried += 1;
      }
    }
    return HttpResponse.json({
      batchId: "9ee94a8f-80d3-48c2-9078-292e80e44741",
      settlementMonth: month,
      retriedSellerCount: retried,
      status: "RUNNING",
      failReason: null,
    });
  }),
];

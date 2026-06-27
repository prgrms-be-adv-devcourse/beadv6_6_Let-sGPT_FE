import { HttpResponse, http } from "msw";

import { sellerSettlements, settlementOrders } from "../data/settlements";

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
    page: Number(url.searchParams.get("page") ?? "0"),
    size: Number(url.searchParams.get("size") ?? "10"),
  };
}

// 판매자/관리자 정산 조회. 목 데이터는 동일(판매자=본인, 관리자=전체) — 게이트웨이가 X-User 로 범위 제한.
export const settlementHandlers = [
  http.get("*/api/v1/settlements/:scope/orders", ({ request }) => {
    const { settlementMonth, status, page, size } = pageParams(request);
    let filtered = settlementOrders;
    if (settlementMonth) {
      filtered = filtered.filter((order) => order.settlementMonth === settlementMonth);
    }
    if (status) {
      filtered = filtered.filter((order) => order.status === status);
    }
    return HttpResponse.json(paginate(filtered, page, size));
  }),

  http.get("*/api/v1/settlements/:scope/sellers", ({ request }) => {
    const { settlementMonth, status, page, size } = pageParams(request);
    let filtered = sellerSettlements;
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
    return HttpResponse.json({ retriedCount: retried });
  }),
];

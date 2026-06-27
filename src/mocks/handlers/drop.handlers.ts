import { HttpResponse, http } from "msw";

import type { DropCard, DropCardPage } from "@/features/drop/model/drop.schema";

const drops: DropCard[] = [
  {
    id: "d-open-1",
    productId: "p1",
    productName: "한정판 러너 SS26",
    thumbnailKey: null,
    dropPrice: 219000,
    totalQuantity: 100,
    remainingQuantity: 37,
    status: "OPEN",
    openAt: "2026-06-27T03:00:00Z",
    closeAt: null,
  },
  {
    id: "d-open-2",
    productId: "p2",
    productName: "콜라보 후디 블랙",
    thumbnailKey: null,
    dropPrice: 139000,
    totalQuantity: 50,
    remainingQuantity: 8,
    status: "OPEN",
    openAt: "2026-06-26T10:00:00Z",
    closeAt: "2026-07-03T10:00:00Z",
  },
  {
    id: "d-open-3",
    productId: "p3",
    productName: "리미티드 캡 화이트",
    thumbnailKey: null,
    dropPrice: 59000,
    totalQuantity: 200,
    remainingQuantity: 152,
    status: "OPEN",
    openAt: "2026-06-25T00:00:00Z",
    closeAt: null,
  },
  {
    id: "d-reg-1",
    productId: "p5",
    productName: "시즌 오프 부츠",
    thumbnailKey: null,
    dropPrice: 289000,
    totalQuantity: 80,
    remainingQuantity: 80,
    status: "REGISTERED",
    openAt: "2026-07-01T00:00:00Z",
    closeAt: null,
  },
  {
    id: "d-reg-2",
    productId: "p7",
    productName: "미니 크로스백",
    thumbnailKey: null,
    dropPrice: 129000,
    totalQuantity: 120,
    remainingQuantity: 120,
    status: "REGISTERED",
    openAt: "2026-07-05T06:00:00Z",
    closeAt: null,
  },
  {
    id: "d-close-1",
    productId: "p6",
    productName: "베이식 티셔츠 드롭",
    thumbnailKey: null,
    dropPrice: 39000,
    totalQuantity: 300,
    remainingQuantity: 0,
    status: "CLOSE",
    openAt: "2026-06-10T00:00:00Z",
    closeAt: "2026-06-17T00:00:00Z",
  },
  {
    id: "d-sold-1",
    productId: "p4",
    productName: "데일리 토트백 드롭",
    thumbnailKey: null,
    dropPrice: 99000,
    totalQuantity: 60,
    remainingQuantity: 0,
    status: "SOLD_OUT",
    openAt: "2026-06-12T00:00:00Z",
    closeAt: null,
  },
];

export const dropHandlers = [
  http.get("*/api/v1/drops", ({ request }) => {
    const status = new URL(request.url).searchParams.get("status");
    const filtered = status ? drops.filter((drop) => drop.status === status) : drops;
    const page: DropCardPage = {
      content: filtered,
      page: 0,
      size: 20,
      totalElements: filtered.length,
      totalPages: 1,
    };
    return HttpResponse.json(page);
  }),
];

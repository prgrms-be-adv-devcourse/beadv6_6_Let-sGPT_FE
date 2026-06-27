import { HttpResponse, http } from "msw";

import type { DropCardPage } from "@/features/drop/model/drop.schema";
import type { ProductPage } from "@/features/product/model/product.schema";

const sampleProductPage: ProductPage = {
  content: [
    { id: "p1", name: "샘플 상품 A", priceAmount: 29000 },
    { id: "p2", name: "샘플 상품 B", priceAmount: 48000 },
  ],
  totalElements: 2,
  page: 0,
  size: 20,
};

const ongoingDrops: DropCardPage = {
  content: [
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
  ],
  page: 0,
  size: 20,
  totalElements: 3,
  totalPages: 1,
};

const upcomingDrops: DropCardPage = {
  content: [
    {
      id: "d-reg-1",
      productId: "p4",
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
      productId: "p5",
      productName: "데일리 토트백",
      thumbnailKey: null,
      dropPrice: 99000,
      totalQuantity: 120,
      remainingQuantity: 120,
      status: "REGISTERED",
      openAt: "2026-07-05T06:00:00Z",
      closeAt: null,
    },
  ],
  page: 0,
  size: 20,
  totalElements: 2,
  totalPages: 1,
};

const emptyDropPage: DropCardPage = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
};

// 베이스 URL 에 무관하게 매칭하도록 와일드카드 prefix 사용(테스트/브라우저 공용).
export const handlers = [
  http.get("*/api/v1/products", () => HttpResponse.json(sampleProductPage)),
  http.get("*/api/v1/drops", ({ request }) => {
    const status = new URL(request.url).searchParams.get("status");
    if (status === "OPEN") {
      return HttpResponse.json(ongoingDrops);
    }
    if (status === "REGISTERED") {
      return HttpResponse.json(upcomingDrops);
    }
    return HttpResponse.json(emptyDropPage);
  }),
];

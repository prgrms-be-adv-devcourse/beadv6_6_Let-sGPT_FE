import { HttpResponse, http } from "msw";

import type { DropCard, DropCardPage, DropStatus } from "@/features/drop/model/drop.schema";

const CATEGORIES = [
  { id: "c-sneakers", name: "스니커즈" },
  { id: "c-apparel", name: "의류" },
  { id: "c-acc", name: "액세서리" },
  { id: "c-bag", name: "가방" },
] as const;

type DropSeed = {
  name: string;
  status: DropStatus;
  cat: number;
  price: number;
  total: number;
  remaining: number;
  openAt: string;
  closeAt: string | null;
};

const DROP_SEED: DropSeed[] = [
  {
    name: "한정판 러너 SS26",
    status: "OPEN",
    cat: 0,
    price: 219000,
    total: 100,
    remaining: 37,
    openAt: "2026-06-27T03:00:00Z",
    closeAt: null,
  },
  {
    name: "콜라보 후디 블랙",
    status: "OPEN",
    cat: 1,
    price: 139000,
    total: 50,
    remaining: 8,
    openAt: "2026-06-26T10:00:00Z",
    closeAt: "2026-07-03T10:00:00Z",
  },
  {
    name: "리미티드 캡 화이트",
    status: "OPEN",
    cat: 2,
    price: 59000,
    total: 200,
    remaining: 152,
    openAt: "2026-06-25T00:00:00Z",
    closeAt: null,
  },
  {
    name: "캔버스 스니커즈",
    status: "OPEN",
    cat: 0,
    price: 89000,
    total: 150,
    remaining: 64,
    openAt: "2026-06-24T00:00:00Z",
    closeAt: null,
  },
  {
    name: "시즌 오프 부츠",
    status: "REGISTERED",
    cat: 0,
    price: 289000,
    total: 80,
    remaining: 80,
    openAt: "2026-07-01T00:00:00Z",
    closeAt: null,
  },
  {
    name: "미니 크로스백",
    status: "REGISTERED",
    cat: 3,
    price: 129000,
    total: 120,
    remaining: 120,
    openAt: "2026-07-05T06:00:00Z",
    closeAt: null,
  },
  {
    name: "오버사이즈 코트",
    status: "REGISTERED",
    cat: 1,
    price: 329000,
    total: 60,
    remaining: 60,
    openAt: "2026-07-10T00:00:00Z",
    closeAt: null,
  },
  {
    name: "베이식 티셔츠 드롭",
    status: "CLOSE",
    cat: 1,
    price: 39000,
    total: 300,
    remaining: 0,
    openAt: "2026-06-10T00:00:00Z",
    closeAt: "2026-06-17T00:00:00Z",
  },
  {
    name: "데일리 토트백 드롭",
    status: "SOLD_OUT",
    cat: 3,
    price: 99000,
    total: 60,
    remaining: 0,
    openAt: "2026-06-12T00:00:00Z",
    closeAt: null,
  },
  {
    name: "버킷햇 블랙 드롭",
    status: "SOLD_OUT",
    cat: 2,
    price: 49000,
    total: 90,
    remaining: 0,
    openAt: "2026-06-08T00:00:00Z",
    closeAt: null,
  },
];

const drops: DropCard[] = DROP_SEED.map((seed, index) => {
  const category = CATEGORIES[seed.cat] ?? CATEGORIES[0];
  return {
    id: `d${index + 1}`,
    productId: `p${index + 1}`,
    productName: seed.name,
    categoryId: category.id,
    categoryName: category.name,
    thumbnailKey: null,
    dropPrice: seed.price,
    totalQuantity: seed.total,
    remainingQuantity: seed.remaining,
    status: seed.status,
    openAt: seed.openAt,
    closeAt: seed.closeAt,
  };
});

export const dropHandlers = [
  http.get("*/api/v1/drops", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const categoryId = url.searchParams.get("categoryId");
    const keyword = url.searchParams.get("keyword");
    const page = Number(url.searchParams.get("page") ?? "0");
    const size = Number(url.searchParams.get("size") ?? "20");

    let filtered = drops;
    if (status) {
      filtered = filtered.filter((drop) => drop.status === status);
    }
    if (categoryId) {
      filtered = filtered.filter((drop) => drop.categoryId === categoryId);
    }
    if (keyword) {
      filtered = filtered.filter((drop) => drop.productName.includes(keyword));
    }

    const sortParam = url.searchParams.get("sort");
    if (sortParam) {
      const [sortField, sortDir] = sortParam.split(",");
      const sign = sortDir === "asc" ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        if (sortField === "dropPrice") {
          return (a.dropPrice - b.dropPrice) * sign;
        }
        if (a.openAt === b.openAt) return 0;
        return (a.openAt < b.openAt ? -1 : 1) * sign;
      });
    }

    const start = page * size;
    const body: DropCardPage = {
      content: filtered.slice(start, start + size),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    };
    return HttpResponse.json(body);
  }),
];

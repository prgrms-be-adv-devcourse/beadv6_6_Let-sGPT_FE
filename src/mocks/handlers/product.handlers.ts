import { HttpResponse, http } from "msw";

import type { Product, ProductPage } from "@/features/product/model/product.schema";

const seller = "11111111-1111-1111-1111-111111111111";

const CATEGORIES = [
  { id: "c-sneakers", name: "스니커즈" },
  { id: "c-apparel", name: "의류" },
  { id: "c-acc", name: "액세서리" },
  { id: "c-bag", name: "가방" },
] as const;

const PRODUCT_NAMES = [
  "한정판 러너 SS26",
  "콜라보 후디 블랙",
  "리미티드 캡 화이트",
  "데일리 토트백",
  "시즌 오프 부츠",
  "베이식 티셔츠",
  "미니 크로스백",
  "시그니처 삭스",
  "트레일 자켓 카키",
  "오버사이즈 코트",
  "니트 비니 그레이",
  "레더 벨트 브라운",
  "캔버스 스니커즈",
  "크롭 후디 아이보리",
  "버킷햇 블랙",
  "숄더백 탠",
];

const products: Product[] = PRODUCT_NAMES.map((name, index) => {
  const category = CATEGORIES[index % CATEGORIES.length] ?? CATEGORIES[0];
  return {
    id: `p${index + 1}`,
    sellerId: seller,
    name,
    description: `${name} 상세 설명`,
    categoryId: category.id,
    categoryName: category.name,
    price: index === 7 ? null : 39000 + index * 10000,
    thumbnailKey: null,
    createdAt: `2026-06-${String(20 - (index % 18)).padStart(2, "0")}T09:00:00Z`,
  };
});

export const productHandlers = [
  http.get("*/api/v1/products", ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId");
    const keyword = url.searchParams.get("keyword");
    const page = Number(url.searchParams.get("page") ?? "0");
    const size = Number(url.searchParams.get("size") ?? "20");

    let filtered = products;
    if (categoryId) {
      filtered = filtered.filter((product) => product.categoryId === categoryId);
    }
    if (keyword) {
      filtered = filtered.filter((product) => product.name.includes(keyword));
    }

    const [sortField, sortDir] = (url.searchParams.get("sort") ?? "createdAt,desc").split(",");
    const sign = sortDir === "asc" ? 1 : -1;
    filtered = [...filtered].sort((a, b) => {
      if (sortField === "price") {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return (a.price - b.price) * sign;
      }
      if (a.createdAt === b.createdAt) return 0;
      return (a.createdAt < b.createdAt ? -1 : 1) * sign;
    });

    const start = page * size;
    const body: ProductPage = {
      content: filtered.slice(start, start + size),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    };
    return HttpResponse.json(body);
  }),
];

import { HttpResponse, http } from "msw";

import type { Product, ProductPage } from "@/features/product/model/product.schema";

const seller = "11111111-1111-1111-1111-111111111111";

const products: Product[] = [
  {
    id: "p1",
    sellerId: seller,
    name: "한정판 러너 SS26",
    description: "경량 러닝 실루엣의 시즌 한정 컬러웨이.",
    categoryId: "c-sneakers",
    categoryName: "스니커즈",
    price: 219000,
    thumbnailKey: null,
    createdAt: "2026-06-20T09:00:00Z",
  },
  {
    id: "p2",
    sellerId: seller,
    name: "콜라보 후디 블랙",
    description: "헤비웨이트 코튼 오버핏 후디.",
    categoryId: "c-apparel",
    categoryName: "의류",
    price: 139000,
    thumbnailKey: null,
    createdAt: "2026-06-19T09:00:00Z",
  },
  {
    id: "p3",
    sellerId: seller,
    name: "리미티드 캡 화이트",
    description: "자수 로고 6패널 볼캡.",
    categoryId: "c-acc",
    categoryName: "액세서리",
    price: 59000,
    thumbnailKey: null,
    createdAt: "2026-06-18T09:00:00Z",
  },
  {
    id: "p4",
    sellerId: seller,
    name: "데일리 토트백",
    description: "데일리로 좋은 캔버스 토트백.",
    categoryId: "c-bag",
    categoryName: "가방",
    price: 99000,
    thumbnailKey: null,
    createdAt: "2026-06-17T09:00:00Z",
  },
  {
    id: "p5",
    sellerId: seller,
    name: "시즌 오프 부츠",
    description: "방수 레더 첼시 부츠.",
    categoryId: "c-sneakers",
    categoryName: "스니커즈",
    price: 289000,
    thumbnailKey: null,
    createdAt: "2026-06-16T09:00:00Z",
  },
  {
    id: "p6",
    sellerId: seller,
    name: "베이식 티셔츠",
    description: "프리미엄 코튼 베이식 티.",
    categoryId: "c-apparel",
    categoryName: "의류",
    price: 39000,
    thumbnailKey: null,
    createdAt: "2026-06-15T09:00:00Z",
  },
  {
    id: "p7",
    sellerId: seller,
    name: "미니 크로스백",
    description: "컴팩트한 데일리 크로스백.",
    categoryId: "c-bag",
    categoryName: "가방",
    price: 129000,
    thumbnailKey: null,
    createdAt: "2026-06-14T09:00:00Z",
  },
  {
    id: "p8",
    sellerId: seller,
    name: "시그니처 삭스",
    description: "출시 예정 — 가격 미정.",
    categoryId: "c-acc",
    categoryName: "액세서리",
    price: null,
    thumbnailKey: null,
    createdAt: "2026-06-13T09:00:00Z",
  },
];

export const productHandlers = [
  http.get("*/api/v1/products", ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId");
    const keyword = url.searchParams.get("keyword");

    let filtered = products;
    if (categoryId) {
      filtered = filtered.filter((product) => product.categoryId === categoryId);
    }
    if (keyword) {
      filtered = filtered.filter((product) => product.name.includes(keyword));
    }

    const page: ProductPage = {
      content: filtered,
      page: 0,
      size: 20,
      totalElements: filtered.length,
      totalPages: 1,
    };
    return HttpResponse.json(page);
  }),
];

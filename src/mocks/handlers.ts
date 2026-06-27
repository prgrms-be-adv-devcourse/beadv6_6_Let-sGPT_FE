import { HttpResponse, http } from "msw";

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

// 베이스 URL 에 무관하게 매칭하도록 와일드카드 prefix 사용(테스트/브라우저 공용).
export const handlers = [http.get("*/api/v1/products", () => HttpResponse.json(sampleProductPage))];

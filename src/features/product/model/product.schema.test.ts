import { describe, expect, it } from "vitest";

import { type Product, productPageSchema, productSchema } from "./product.schema";

const validProduct: Product = {
  id: "p1",
  sellerId: "s1",
  name: "상품",
  description: "설명",
  categoryId: null,
  categoryName: null,
  price: 1000,
  thumbnailKey: null,
  createdAt: "2026-06-01T00:00:00Z",
};

describe("productSchema", () => {
  it("유효한 상품을 파싱한다(price null 허용)", () => {
    expect(productSchema.parse(validProduct).name).toBe("상품");
    expect(productSchema.parse({ ...validProduct, price: null }).price).toBeNull();
  });

  it("price 가 숫자/널이 아니면 거부한다", () => {
    expect(() => productSchema.parse({ ...validProduct, price: "x" })).toThrow();
  });
});

describe("productPageSchema", () => {
  it("페이지 응답을 파싱한다", () => {
    const page = productPageSchema.parse({
      content: [validProduct],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });
    expect(page.content).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";

import { productPageSchema, productSchema } from "./product.schema";

describe("productSchema", () => {
  it("유효한 상품을 파싱한다", () => {
    const parsed = productSchema.parse({ id: "p1", name: "상품", priceAmount: 1000 });
    expect(parsed.name).toBe("상품");
  });

  it("priceAmount 가 숫자가 아니면 거부한다", () => {
    expect(() => productSchema.parse({ id: "p1", name: "상품", priceAmount: "x" })).toThrow();
  });
});

describe("productPageSchema", () => {
  it("페이지 응답을 파싱한다", () => {
    const page = productPageSchema.parse({
      content: [{ id: "p1", name: "상품", priceAmount: 1000 }],
      totalElements: 1,
      page: 0,
      size: 20,
    });
    expect(page.content).toHaveLength(1);
  });
});

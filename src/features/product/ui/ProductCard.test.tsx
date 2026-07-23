import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Product } from "../model/product.schema";
import { ProductCard } from "./ProductCard";

vi.mock("@/features/wishlist/ui/WishlistButton", () => ({
  WishlistButton: () => null,
}));

const baseProduct: Product = {
  id: "p1",
  sellerId: "s1",
  name: "테스트 상품",
  description: "설명",
  categoryId: "c1",
  categoryName: "스니커즈",
  price: 12000,
  thumbnailKey: null,
  createdAt: "2026-06-01T00:00:00Z",
};

describe("ProductCard", () => {
  it("상품명·카테고리·원화 가격을 렌더링한다", () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByText("테스트 상품")).toBeInTheDocument();
    expect(screen.getByText("스니커즈")).toBeInTheDocument();
    expect(screen.getByText(/12,000/)).toBeInTheDocument();
  });

  it("가격이 null 이면 '가격 미정'으로 표시한다", () => {
    render(<ProductCard product={{ ...baseProduct, price: null }} />);

    expect(screen.getByText("가격 미정")).toBeInTheDocument();
  });
});

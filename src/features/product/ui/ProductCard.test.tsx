import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  it("상품명과 원화 가격을 렌더링한다", () => {
    render(<ProductCard product={{ id: "p1", name: "테스트 상품", priceAmount: 12000 }} />);

    expect(screen.getByText("테스트 상품")).toBeInTheDocument();
    expect(screen.getByText(/12,000/)).toBeInTheDocument();
  });
});

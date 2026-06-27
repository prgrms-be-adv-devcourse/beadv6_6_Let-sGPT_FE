import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DropCard as DropCardModel } from "../model/drop.schema";
import { DropCard } from "./DropCard";

const baseDrop: DropCardModel = {
  id: "d1",
  productId: "p1",
  productName: "한정판 운동화",
  thumbnailKey: null,
  dropPrice: 219000,
  totalQuantity: 100,
  remainingQuantity: 37,
  status: "OPEN",
  openAt: "2026-07-01T00:00:00Z",
  closeAt: null,
};

describe("DropCard", () => {
  it("상품명·가격·진행 상태·재고를 렌더링한다", () => {
    render(<DropCard drop={baseDrop} />);

    expect(screen.getByText("한정판 운동화")).toBeInTheDocument();
    expect(screen.getByText(/219,000/)).toBeInTheDocument();
    expect(screen.getByText("진행중")).toBeInTheDocument();
    expect(screen.getByText(/37/)).toBeInTheDocument();
  });

  it("매진 상태는 매진 배지를 보여준다", () => {
    render(<DropCard drop={{ ...baseDrop, status: "SOLD_OUT", remainingQuantity: 0 }} />);

    expect(screen.getByText("매진")).toBeInTheDocument();
  });
});

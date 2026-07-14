import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductSearchToolbar } from "./ProductSearchToolbar";

const categories = [
  { id: "c-apparel", name: "의류" },
  { id: "c-electronics", name: "전자기기" },
];

describe("ProductSearchToolbar", () => {
  it("카테고리 버튼을 누르면 카테고리명을 즉시 전달한다", async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();
    render(
      <ProductSearchToolbar
        categories={categories}
        categoryName={null}
        isSearching={false}
        onCategoryChange={onCategoryChange}
        onSearch={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "전자기기" }));

    expect(onCategoryChange).toHaveBeenCalledWith("전자기기");
  });

  it("검색 버튼으로 가격 범위와 자연어 검색값을 한 번에 전달한다", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <ProductSearchToolbar
        categories={categories}
        categoryName={null}
        isSearching={false}
        onCategoryChange={vi.fn()}
        onSearch={onSearch}
      />,
    );

    await user.type(screen.getByRole("spinbutton", { name: "최소 가격" }), "10000");
    await user.type(screen.getByRole("spinbutton", { name: "최대 가격" }), "50000");
    await user.type(screen.getByRole("searchbox", { name: "자연어 검색" }), "가벼운 미니 가방");
    await user.click(screen.getByRole("button", { name: "검색" }));

    expect(onSearch).toHaveBeenCalledWith({
      query: "가벼운 미니 가방",
      startPrice: 10000,
      endPrice: 50000,
      sort: "createdAt,desc",
    });
  });

  it("선택한 정렬을 검색 조건과 함께 전달한다", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <ProductSearchToolbar
        categories={categories}
        categoryName={null}
        isSearching={false}
        onCategoryChange={vi.fn()}
        onSearch={onSearch}
      />,
    );

    await user.type(screen.getByRole("searchbox", { name: "자연어 검색" }), "여름 셔츠");
    await user.click(screen.getByRole("button", { name: "정렬" }));
    await user.click(screen.getByRole("option", { name: "가격 낮은순" }));

    expect(onSearch).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "검색" }));

    expect(onSearch).toHaveBeenCalledWith({
      query: "여름 셔츠",
      startPrice: null,
      endPrice: null,
      sort: "price,asc",
    });
  });

  it("최소 가격이 최대 가격보다 크면 호출하지 않고 오류를 표시한다", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <ProductSearchToolbar
        categories={categories}
        categoryName={null}
        isSearching={false}
        onCategoryChange={vi.fn()}
        onSearch={onSearch}
      />,
    );

    await user.type(screen.getByRole("spinbutton", { name: "최소 가격" }), "50000");
    await user.type(screen.getByRole("spinbutton", { name: "최대 가격" }), "10000");
    await user.click(screen.getByRole("button", { name: "검색" }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "최소 가격은 최대 가격보다 클 수 없습니다.",
    );
  });
});

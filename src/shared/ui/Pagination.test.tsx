import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("현재 페이지가 속한 5페이지 묶음을 표시한다", () => {
    render(<Pagination page={0} totalPages={8} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "6" })).not.toBeInTheDocument();
  });

  it("6페이지부터 다음 5페이지 묶음을 표시한다", () => {
    render(<Pagination page={5} totalPages={8} onPageChange={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "5" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "8" })).toBeInTheDocument();
  });

  it("다음 버튼으로 다음 페이지를 전달한다", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={0} totalPages={8} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

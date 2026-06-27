import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useProductList } from "./products.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useProductList", () => {
  it("MSW 목 응답을 Zod 검증 후 페이지로 반환한다(전체 데이터 루프)", async () => {
    const { result } = renderHook(() => useProductList(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.content.length).toBeGreaterThan(0);
    expect(result.current.data?.totalElements).toBeGreaterThan(0);
  });

  it("키워드로 검색하면 해당 상품만 반환한다", async () => {
    const { result } = renderHook(() => useProductList({ keyword: "러너" }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const names = result.current.data?.content.map((product) => product.name) ?? [];
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => name.includes("러너"))).toBe(true);
  });
});

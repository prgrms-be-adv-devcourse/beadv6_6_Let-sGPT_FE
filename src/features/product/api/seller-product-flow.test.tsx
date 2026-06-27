import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it } from "vitest";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useCreateProduct, useMyProducts } from "./products.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("판매자 상품 등록 플로우 (scoped 토큰 교환 + MSW)", () => {
  beforeAll(() => {
    useAuthStore.setState({ accessToken: "mock-access-token" });
  });

  it("상품을 등록하면 내 상품 목록(GET /products/me)에 노출된다", async () => {
    const { result } = renderHook(
      () => ({ create: useCreateProduct(), mine: useMyProducts({ page: 0, size: 50 }) }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.mine.data).toBeDefined());
    const before = result.current.mine.data?.totalElements ?? 0;

    await act(async () => {
      await result.current.create.mutateAsync({
        sellerInfoId: "s-1",
        body: { name: "테스트 한정판 후디", price: 99000 },
      });
    });

    await waitFor(() => expect(result.current.mine.data?.totalElements ?? 0).toBe(before + 1));
    expect(
      result.current.mine.data?.content.some((product) => product.name === "테스트 한정판 후디"),
    ).toBe(true);
  });
});

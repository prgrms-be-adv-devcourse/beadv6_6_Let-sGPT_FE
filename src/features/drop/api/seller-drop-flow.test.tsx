import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it } from "vitest";

import { useAuthStore } from "@/features/auth/store/authStore";
import { fetchDrops } from "./drops.api";
import { useCreateDrop } from "./drops.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("판매자 드롭 생성 플로우 (판매자 토큰 재발급 + MSW)", () => {
  beforeAll(() => {
    useAuthStore.setState({
      accessToken: "mock-access-token",
      sellerToken: null,
      sellerTokenStoreId: null,
      sellerTokenExpiresAt: null,
    });
  });

  it("상품에 드롭을 생성하면 드롭 목록에 추가된다", async () => {
    const { result } = renderHook(() => useCreateDrop(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        sellerInfoId: "s-1",
        body: {
          productId: "p1",
          dropPrice: 150000,
          totalQuantity: 30,
          openAt: "2099-01-01T00:00:00.000Z",
        },
      });
    });

    const page = await fetchDrops({ size: 100 });
    const created = page.content.find(
      (drop) => drop.productId === "p1" && drop.dropPrice === 150000,
    );
    expect(created).toBeDefined();
    expect(created?.status).toBe("REGISTERED");
    expect(created?.remainingQuantity).toBe(30);
  });
});

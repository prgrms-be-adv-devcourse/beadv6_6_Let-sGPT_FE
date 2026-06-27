import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useRetryFailedSettlements, useSellerSettlements } from "./settlements.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("정산 조회·재시도 플로우 (MSW)", () => {
  it("월 필터로 판매자 정산을 조회한다", async () => {
    const { result } = renderHook(
      () => useSellerSettlements("admin", { settlementMonth: "202606", page: 0, size: 10 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.content.length).toBe(1);
    expect(result.current.data?.content[0]?.settlementMonth).toBe("202606");
  });

  it("실패 정산을 재시도하면 COMPLETED 로 전환된다", async () => {
    const { result } = renderHook(
      () => ({
        retry: useRetryFailedSettlements(),
        failed: useSellerSettlements("admin", { status: "FAILED" }),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.failed.data).toBeDefined());
    expect(result.current.failed.data?.content.length).toBeGreaterThan(0);

    await act(async () => {
      const response = await result.current.retry.mutateAsync("202604");
      expect(response.retriedCount).toBeGreaterThan(0);
    });

    await waitFor(() => expect(result.current.failed.data?.content.length).toBe(0));
  });
});

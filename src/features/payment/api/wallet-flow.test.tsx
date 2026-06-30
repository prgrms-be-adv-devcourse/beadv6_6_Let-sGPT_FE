import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useChargeWallet, useConfirmWalletCharge, useWalletBalance } from "./payments.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("지갑 충전 플로우 (MSW 상태저장)", () => {
  it("MOCK 충전 후 잔액 조회가 충전액만큼 증가한다", async () => {
    const { result } = renderHook(
      () => ({ balance: useWalletBalance(), charge: useChargeWallet() }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.balance.data).toBeDefined());
    const before = result.current.balance.data?.balance ?? 0;

    await act(async () => {
      const charged = await result.current.charge.mutateAsync({ amount: 50_000, method: "MOCK" });
      expect(charged.status).toBe("APPROVED");
    });

    await waitFor(() => expect(result.current.balance.data?.balance).toBe(before + 50_000));
  });

  it("PG 충전(charge→confirm) 후 잔액 조회가 충전액만큼 증가한다", async () => {
    const { result } = renderHook(
      () => ({
        balance: useWalletBalance(),
        charge: useChargeWallet(),
        confirmCharge: useConfirmWalletCharge(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.balance.data).toBeDefined());
    const before = result.current.balance.data?.balance ?? 0;

    await act(async () => {
      const created = await result.current.charge.mutateAsync({ amount: 30_000, method: "PG" });
      expect(created.status).toBe("PENDING");
      const confirmed = await result.current.confirmCharge.mutateAsync({
        chargeId: created.chargeId,
        amount: 30_000,
        paymentKey: `mock-${created.chargeId}`,
      });
      expect(confirmed.status).toBe("APPROVED");
    });

    await waitFor(() => expect(result.current.balance.data?.balance).toBe(before + 30_000));
  });
});

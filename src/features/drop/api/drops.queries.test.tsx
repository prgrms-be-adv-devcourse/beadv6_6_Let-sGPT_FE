import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useOngoingDrops, useUpcomingDrops } from "./drops.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("drop 조회 훅 (MSW + Zod 경계)", () => {
  it("진행중 드롭은 OPEN 상태만 반환한다", async () => {
    const { result } = renderHook(() => useOngoingDrops(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const drops = result.current.data?.content ?? [];
    expect(drops.length).toBeGreaterThan(0);
    expect(drops.every((drop) => drop.status === "OPEN")).toBe(true);
  });

  it("오픈 예정 드롭은 REGISTERED 상태를 반환한다", async () => {
    const { result } = renderHook(() => useUpcomingDrops(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.content[0]?.status).toBe("REGISTERED");
  });
});

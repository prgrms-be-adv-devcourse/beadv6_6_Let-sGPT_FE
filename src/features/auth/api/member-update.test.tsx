import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useUpdateMember } from "./auth.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("회원 정보 수정 (PATCH /me)", () => {
  it("닉네임 변경 시 갱신된 MemberResponse 를 반환한다", async () => {
    const { result } = renderHook(() => useUpdateMember(), { wrapper });

    await act(async () => {
      const updated = await result.current.mutateAsync({ nickname: "새로운닉네임" });
      expect(updated.nickname).toBe("새로운닉네임");
    });
  });
});

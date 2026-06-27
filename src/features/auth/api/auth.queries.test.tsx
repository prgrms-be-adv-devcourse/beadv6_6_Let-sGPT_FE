import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../store/authStore";
import { useLogin } from "./auth.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => useAuthStore.getState().clear());

describe("useLogin (MSW member 엔드포인트 + 세션 저장)", () => {
  it("로그인 성공 시 토큰과 /me 회원정보를 세션에 저장한다", async () => {
    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ email: "demo@openat.kr", password: "password1" });
    });

    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe("mock-access-token"));
    expect(useAuthStore.getState().member?.nickname).toBe("오픈앳러버");
  });
});

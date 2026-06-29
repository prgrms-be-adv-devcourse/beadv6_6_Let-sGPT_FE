import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";

import { authContext } from "@/features/auth/lib/authContext";
import { useAuthStore } from "@/features/auth/store/authStore";
import { routeTree } from "@/routeTree.gen";
import { setAccessTokenProvider } from "@/shared/api/http";
import { queryClient } from "./queryClient";

// 인증 HTTP 헬퍼에 토큰 게터 주입(shared ↔ auth 피처 분리).
setAccessTokenProvider(() => useAuthStore.getState().accessToken);

const router = createRouter({
  routeTree,
  context: { queryClient, auth: authContext },
  defaultPreload: "intent",
  scrollRestoration: true,
});

// 로그인/로그아웃 등 인증 상태가 바뀌면 현재 매치를 재평가 → 보호 라우트 가드가 즉시 반영
// (예: 보호 페이지에 머문 채 로그아웃하면 로그인 화면으로 밀려남).
useAuthStore.subscribe((state, prev) => {
  if (state.member !== prev.member) {
    router.invalidate();
  }
});

// 라우터 인스턴스 타입을 전역에 등록 → Link/navigate 가 end-to-end 타입드(§2).
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/** 앱 전역 Provider 조립 지점(서버 상태 + 라우팅). 진입점은 얇게 유지한다. */
export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";

import { routeTree } from "@/routeTree.gen";
import { queryClient } from "./queryClient";

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  scrollRestoration: true,
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

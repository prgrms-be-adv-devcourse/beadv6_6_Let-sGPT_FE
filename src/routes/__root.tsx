import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SiteFooter } from "@/app/layout/SiteFooter";
import { SiteHeader } from "@/app/layout/SiteHeader";
import type { AuthContext } from "@/features/auth/lib/authContext";

type RouterContext = {
  queryClient: QueryClient;
  auth: AuthContext;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:py-14">
        <Outlet />
      </main>
      <SiteFooter />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}

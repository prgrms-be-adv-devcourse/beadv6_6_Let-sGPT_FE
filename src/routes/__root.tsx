import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-dvh">
      <header className="flex gap-4 border-b px-6 py-4">
        <Link to="/" className="font-semibold [&.active]:underline">
          홈
        </Link>
        <Link to="/products" className="[&.active]:underline">
          상품
        </Link>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}

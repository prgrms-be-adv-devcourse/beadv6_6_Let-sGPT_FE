import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireRole } from "@/features/auth/lib/guards";

/** `/seller/*` 전체의 레이아웃 — 판매자(ROLE_SELLER)만 진입(가드 단일화). */
export const Route = createFileRoute("/seller")({
  beforeLoad: ({ context, location }) => requireRole(context.auth, location.href, "ROLE_SELLER"),
  component: Outlet,
});

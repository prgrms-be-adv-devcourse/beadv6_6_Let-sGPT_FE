import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireRole } from "@/features/auth/lib/guards";

/** `/admin/*` 전체의 레이아웃 — 관리자(ROLE_ADMIN)만 진입(가드 단일화). */
export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context, location }) => requireRole(context.auth, location.href, "ROLE_ADMIN"),
  component: Outlet,
});

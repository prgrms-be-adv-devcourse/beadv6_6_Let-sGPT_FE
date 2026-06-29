import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireAuth } from "@/features/auth/lib/guards";

/**
 * 로그인이 필요한 라우트 묶음의 pathless 레이아웃.
 * URL 에 세그먼트를 더하지 않으면서, 이 아래 모든 자식의 진입 전에 인증을 강제한다(가드 단일화).
 */
export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ context, location }) => requireAuth(context.auth, location.href),
  component: Outlet,
});

import { redirect } from "@tanstack/react-router";

import type { Role } from "../model/auth.schema";
import type { AuthContext } from "./authContext";

/**
 * 라우트 `beforeLoad` 인증 가드.
 * 비로그인 접근은 로그인 화면으로 보내되, 로그인 후 원래 위치로 복귀하도록
 * 목적지(href)를 `redirect` 검색값으로 동봉한다.
 *
 * @example beforeLoad: ({ context, location }) => requireAuth(context.auth, location.href)
 */
export function requireAuth(auth: AuthContext, href: string) {
  if (!auth.isAuthenticated) {
    throw redirect({ to: "/login", search: { redirect: href } });
  }
}

/**
 * 로그인 + 특정 역할을 요구하는 가드.
 * 비로그인은 로그인 화면으로, 로그인했지만 역할이 다르면 403 안내 화면으로 보낸다.
 */
export function requireRole(auth: AuthContext, href: string, role: Role) {
  requireAuth(auth, href);
  if (auth.member?.role !== role) {
    throw redirect({ to: "/forbidden" });
  }
}

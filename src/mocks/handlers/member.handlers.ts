import { HttpResponse, http } from "msw";

import type { Member, TokenResponse } from "@/features/auth/model/auth.schema";

export const memberHandlers = [
  // 회원가입 → MemberResponse(201)
  http.post("*/api/v1/members", async ({ request }) => {
    const body = (await request.json()) as { email: string; nickname: string };
    const member: Member = {
      id: "m-new",
      email: body.email,
      nickname: body.nickname,
      role: "ROLE_USER",
      platformType: "LOCAL",
    };
    return HttpResponse.json(member, { status: 201 });
  }),

  // 로그인 → TokenResponse(200)
  http.post("*/api/v1/members/login", () => {
    const token: TokenResponse = {
      tokenType: "Bearer",
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600,
    };
    return HttpResponse.json(token);
  }),

  // 내 정보 → MemberResponse(200)
  http.get("*/api/v1/members/me", () => {
    const member: Member = {
      id: "m-demo",
      email: "demo@openat.kr",
      nickname: "오픈앳러버",
      role: "ROLE_USER",
      platformType: "LOCAL",
    };
    return HttpResponse.json(member);
  }),
];

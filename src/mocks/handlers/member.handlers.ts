import { HttpResponse, http } from "msw";

import type { Member, TokenResponse } from "@/features/auth/model/auth.schema";

const demoMember: Member = {
  id: "m-demo",
  email: "demo@openat.kr",
  nickname: "오픈앳러버",
  role: "ROLE_USER",
  platformType: "LOCAL",
};

function issueToken(): TokenResponse {
  return {
    tokenType: "Bearer",
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresIn: 3600,
  };
}

export const memberHandlers = [
  http.post("*/api/v1/members", async ({ request }) => {
    const body = (await request.json()) as { email: string; nickname: string };
    return HttpResponse.json<Member>(
      {
        id: "m-new",
        email: body.email,
        nickname: body.nickname,
        role: "ROLE_USER",
        platformType: "LOCAL",
      },
      { status: 201 },
    );
  }),

  http.post("*/api/v1/members/login", () => HttpResponse.json(issueToken())),
  http.post("*/api/v1/members/refresh", () => HttpResponse.json(issueToken())),
  http.post("*/api/v1/members/logout", () => new HttpResponse(null, { status: 204 })),
  http.delete("*/api/v1/members/me", () => new HttpResponse(null, { status: 204 })),

  http.get("*/api/v1/members/me", () => HttpResponse.json(demoMember)),

  http.patch("*/api/v1/members/me", async ({ request }) => {
    const body = (await request.json()) as { nickname?: string; password?: string };
    if (body.nickname) {
      demoMember.nickname = body.nickname;
    }
    return HttpResponse.json(demoMember);
  }),

  // 판매자 토큰 발급(스토어 범위) — BE 구현됨(POST /api/v1/seller/token).
  // 회원 JWT 인증 + sellerInfoId 범위의 판매자 JWT 발급(회원 JWT 와 별도).
  http.post("*/api/v1/seller/token", async ({ request }) => {
    const body = (await request.json()) as { sellerInfoId?: string };
    return HttpResponse.json({
      tokenType: "Bearer",
      accessToken: `mock-seller-token:${body.sellerInfoId ?? "unknown"}`,
      expiresIn: 120,
    });
  }),
];

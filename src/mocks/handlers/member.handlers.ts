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

  // RFC 8693 scoped 토큰 교환(판매자 product write). 실제 BE 는 form-urlencoded.
  http.post("*/auth/token", () =>
    HttpResponse.json({
      access_token: "mock-scoped-token",
      issued_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_type: "Bearer",
      expires_in: 120,
      scope: "product:write",
    }),
  ),
];

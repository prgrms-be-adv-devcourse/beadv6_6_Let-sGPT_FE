import { HttpResponse, http } from "msw";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import { ApiError, setAccessTokenProvider, setTokenRefreshHandler } from "@/shared/api/http";
import type { Member } from "../model/auth.schema";
import { useAuthStore } from "../store/authStore";
import { getMe, refreshSession } from "./auth.api";

const member: Member = {
  id: "m-1",
  email: "demo@openat.kr",
  nickname: "오픈앳러버",
  role: "ROLE_USER",
  platformType: "LOCAL",
};

function tokenJson(accessToken: string) {
  return HttpResponse.json({
    tokenType: "Bearer",
    accessToken,
    refreshToken: "rt-rotated",
    expiresIn: 3600,
  });
}

// 앱 부팅(app/providers.tsx)과 동일하게 토큰 게터 + refresh 안전망을 apiFetch 경계에 주입.
beforeAll(() => {
  setAccessTokenProvider(() => useAuthStore.getState().accessToken);
  setTokenRefreshHandler(refreshSession);
});

afterEach(() => useAuthStore.getState().clear());

describe("apiFetch 회원 토큰 refresh 안전망", () => {
  it("access 토큰 만료(401) 시 refresh 로 재발급하고 새 토큰으로 1회 재시도한다", async () => {
    useAuthStore.setState({ accessToken: "stale-access", refreshToken: "rt", member });

    let meCalls = 0;
    const authHeaders: (string | null)[] = [];
    server.use(
      http.post("*/api/v1/members/refresh", () => tokenJson("fresh-access")),
      http.get("*/api/v1/members/me", ({ request }) => {
        meCalls += 1;
        authHeaders.push(request.headers.get("Authorization"));
        if (meCalls === 1) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json(member);
      }),
    );

    const result = await getMe();

    expect(result.email).toBe("demo@openat.kr");
    expect(meCalls).toBe(2);
    expect(authHeaders[0]).toBe("Bearer stale-access");
    expect(authHeaders[1]).toBe("Bearer fresh-access");
    expect(useAuthStore.getState().accessToken).toBe("fresh-access");
    expect(useAuthStore.getState().refreshToken).toBe("rt-rotated");
  });

  it("refresh 실패 시 세션을 정리하고 원래 에러를 전파한다", async () => {
    useAuthStore.setState({ accessToken: "stale-access", refreshToken: "rt", member });

    server.use(
      http.post("*/api/v1/members/refresh", () => new HttpResponse(null, { status: 401 })),
      http.get("*/api/v1/members/me", () => new HttpResponse(null, { status: 401 })),
    );

    await expect(getMe()).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().member).toBeNull();
  });

  it("동시 다발 401 은 single-flight 로 refresh 를 한 번만 호출한다", async () => {
    useAuthStore.setState({ accessToken: "stale-access", refreshToken: "rt", member });

    let refreshCalls = 0;
    server.use(
      http.post("*/api/v1/members/refresh", () => {
        refreshCalls += 1;
        return tokenJson("fresh-access");
      }),
      http.get("*/api/v1/members/me", ({ request }) => {
        if (request.headers.get("Authorization") === "Bearer stale-access") {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json(member);
      }),
    );

    const [a, b] = await Promise.all([getMe(), getMe()]);

    expect(a.email).toBe("demo@openat.kr");
    expect(b.email).toBe("demo@openat.kr");
    expect(refreshCalls).toBe(1);
    expect(useAuthStore.getState().accessToken).toBe("fresh-access");
  });
});

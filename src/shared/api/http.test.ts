import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { server } from "@/mocks/server";
import { apiFetch, apiFetchResponse, setAccessTokenProvider } from "./http";

const probeSchema = z.object({ ok: z.boolean() });

describe("apiFetch reauth (401 → 새 토큰으로 1회 재시도)", () => {
  afterEach(() => setAccessTokenProvider(() => null));

  it("401 이면 reauth 로 새 토큰을 받아 같은 요청을 재시도하고 성공한다", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/v1/_probe", ({ request }) => {
        calls += 1;
        if (request.headers.get("Authorization") !== "Bearer fresh-token") {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({ ok: true });
      }),
    );
    const reauth = vi.fn(async () => "fresh-token");

    const result = await apiFetch("/api/v1/_probe", probeSchema, {
      token: "stale-token",
      reauth,
    });

    expect(result.ok).toBe(true);
    expect(reauth).toHaveBeenCalledTimes(1);
    expect(calls).toBe(2); // 최초 401 + 재시도 성공
  });

  it("reauth 가 없으면 401 을 그대로 ApiError(status 401) 로 던진다", async () => {
    server.use(http.get("*/api/v1/_probe", () => new HttpResponse(null, { status: 401 })));

    await expect(apiFetch("/api/v1/_probe", probeSchema, { token: "x" })).rejects.toMatchObject({
      status: 401,
    });
  });

  it("스트리밍 Response에도 회원 토큰과 Accept 헤더를 주입한다", async () => {
    let authorization = "";
    let accept = "";
    setAccessTokenProvider(() => "member-token");
    server.use(
      http.post("*/api/v1/_stream", ({ request }) => {
        authorization = request.headers.get("Authorization") ?? "";
        accept = request.headers.get("Accept") ?? "";
        return new HttpResponse("event: done\ndata: {}\n\n", {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const response = await apiFetchResponse("/api/v1/_stream", {
      method: "POST",
      body: { message: "test" },
      accept: "text/event-stream",
    });

    expect(response.ok).toBe(true);
    expect(authorization).toBe("Bearer member-token");
    expect(accept).toBe("text/event-stream");
  });
});

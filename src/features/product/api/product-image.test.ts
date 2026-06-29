import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import { uploadProductImage } from "./products.api";

describe("상품 이미지 업로드 (multipart + MSW)", () => {
  it("파일을 업로드하면 저장 key·조회 url 을 돌려준다", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" });

    const result = await uploadProductImage(file, {
      token: "seller-token",
      reauth: async () => "seller-token",
    });

    expect(result.key).toMatch(/\.jpg$/);
    expect(result.url).toContain(`/api/v1/products/images/${result.key}`);
  });

  // 회귀: 업로드 경로는 /products/** 라 회원 토큰이 아닌 판매자 스토어 범위 토큰이 실려야 한다.
  it("판매자 토큰을 Authorization 헤더로 실어 보낸다", async () => {
    let authHeader: string | null = null;
    server.use(
      http.post("*/api/v1/products/images", ({ request }) => {
        authHeader = request.headers.get("Authorization");
        return HttpResponse.json({ key: "k.jpg", url: "/api/v1/products/images/k.jpg" });
      }),
    );

    const file = new File([new Uint8Array([1])], "p.png", { type: "image/png" });
    await uploadProductImage(file, { token: "seller-scoped-token", reauth: async () => "x" });

    expect(authHeader).toBe("Bearer seller-scoped-token");
  });
});

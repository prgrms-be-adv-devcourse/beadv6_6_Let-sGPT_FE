import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import { presignProductImage, uploadProductImage, uploadToS3 } from "./products.api";

const seller = { token: "seller-token", reauth: async () => "seller-token" };

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

describe("이미지 presign 발급 (S3 staging + MSW)", () => {
  it("presign 을 발급하면 stagingKey·uploadUrl·expiresAt 스키마로 파싱된다", async () => {
    const result = await presignProductImage(
      { filename: "photo.png", contentType: "image/png" },
      seller,
    );

    // filename 확장자를 살린 staging 키
    expect(result.stagingKey).toMatch(/^staging\/.+\.png$/);
    expect(result.uploadUrl).toContain(result.stagingKey);
    expect(result.uploadUrl).toContain("X-Amz-Signature");
    // expiresAt 은 파싱 가능한 ISO
    expect(Number.isNaN(Date.parse(result.expiresAt))).toBe(false);
  });

  it("판매자 토큰을 Authorization 헤더로 실어 보낸다", async () => {
    let authHeader: string | null = null;
    server.use(
      http.post("*/api/v1/products/images/presign", ({ request }) => {
        authHeader = request.headers.get("Authorization");
        return HttpResponse.json({
          stagingKey: "staging/k.png",
          uploadUrl: "https://s3.example.com/staging/k.png?X-Amz-Signature=mock",
          expiresAt: new Date().toISOString(),
        });
      }),
    );

    await presignProductImage(
      { filename: "p.png", contentType: "image/png" },
      { token: "seller-scoped-token", reauth: async () => "x" },
    );

    expect(authHeader).toBe("Bearer seller-scoped-token");
  });
});

describe("uploadToS3 (외부 S3 오리진 직행 PUT + MSW)", () => {
  it("200 이면 정상 완료된다", async () => {
    const { uploadUrl } = await presignProductImage(
      { filename: "photo.png", contentType: "image/png" },
      seller,
    );
    const file = new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" });

    await expect(uploadToS3(uploadUrl, file)).resolves.toBeUndefined();
  });

  it("Content-Type 만 헤더로 싣고 다른 헤더는 붙이지 않는다", async () => {
    let contentType: string | null = null;
    let authHeader: string | null = null;
    server.use(
      http.put(
        "https://team02-letsgpt-images-staging.s3.ap-northeast-2.amazonaws.com/*",
        ({ request }) => {
          contentType = request.headers.get("Content-Type");
          authHeader = request.headers.get("Authorization");
          return new HttpResponse(null, { status: 200 });
        },
      ),
    );

    const { uploadUrl } = await presignProductImage(
      { filename: "photo.webp", contentType: "image/webp" },
      seller,
    );
    const file = new File([new Uint8Array([1])], "photo.webp", { type: "image/webp" });
    await uploadToS3(uploadUrl, file);

    expect(contentType).toBe("image/webp");
    expect(authHeader).toBeNull();
  });

  it("403 이면 상태코드를 담아 throw 한다", async () => {
    const uploadUrl =
      "https://team02-letsgpt-images-staging.s3.ap-northeast-2.amazonaws.com/staging/denied.png?X-Amz-Signature=mock";
    server.use(http.put(uploadUrl, () => new HttpResponse(null, { status: 403 })));

    const file = new File([new Uint8Array([1])], "denied.png", { type: "image/png" });
    await expect(uploadToS3(uploadUrl, file)).rejects.toThrow(/403/);
  });
});

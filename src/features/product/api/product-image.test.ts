import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import { presignProductImage, uploadToS3 } from "./products.api";

const seller = { token: "seller-token", reauth: async () => "seller-token" };

describe("이미지 presign 발급 (S3 staging + MSW)", () => {
  it("presign 을 발급하면 stagingKey·uploadUrl·expiresAt 스키마로 파싱된다", async () => {
    const result = await presignProductImage({ contentType: "image/png" }, seller);

    // 확장자는 BE 가 contentType 으로 정한다
    expect(result.stagingKey).toMatch(/^staging\/.+\.png$/);
    // 업로드 URL 은 상대 key 가 아니라 스토리지 prefix 경로를 담는다
    expect(result.uploadUrl).toContain(`/images/${result.stagingKey}`);
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
      { contentType: "image/png" },
      { token: "seller-scoped-token", reauth: async () => "x" },
    );

    expect(authHeader).toBe("Bearer seller-scoped-token");
  });
});

describe("uploadToS3 (외부 S3 오리진 직행 PUT + MSW)", () => {
  it("200 이면 정상 완료된다", async () => {
    const { uploadUrl } = await presignProductImage({ contentType: "image/png" }, seller);
    const file = new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" });

    await expect(uploadToS3(uploadUrl, file)).resolves.toBeUndefined();
  });

  it("Content-Type 만 헤더로 싣고 다른 헤더는 붙이지 않는다", async () => {
    let contentType: string | null = null;
    let authHeader: string | null = null;
    server.use(
      http.put("https://team02-letsgpt-bucket.s3.ap-northeast-2.amazonaws.com/*", ({ request }) => {
        contentType = request.headers.get("Content-Type");
        authHeader = request.headers.get("Authorization");
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const { uploadUrl } = await presignProductImage({ contentType: "image/webp" }, seller);
    const file = new File([new Uint8Array([1])], "photo.webp", { type: "image/webp" });
    await uploadToS3(uploadUrl, file);

    expect(contentType).toBe("image/webp");
    expect(authHeader).toBeNull();
  });

  it("403 이면 상태코드를 담아 throw 한다", async () => {
    const uploadUrl =
      "https://team02-letsgpt-bucket.s3.ap-northeast-2.amazonaws.com/images/staging/denied.png?X-Amz-Signature=mock";
    server.use(http.put(uploadUrl, () => new HttpResponse(null, { status: 403 })));

    const file = new File([new Uint8Array([1])], "denied.png", { type: "image/png" });
    await expect(uploadToS3(uploadUrl, file)).rejects.toThrow(/403/);
  });
});

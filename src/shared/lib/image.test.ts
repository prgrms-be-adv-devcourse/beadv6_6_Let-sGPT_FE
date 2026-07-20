import { describe, expect, it } from "vitest";

import { buildGallery, resolveImageSrc } from "./image";

describe("resolveImageSrc", () => {
  it("풀 URL(picsum 등)은 그대로 둔다", () => {
    expect(resolveImageSrc("https://picsum.photos/seed/x/640/800")).toBe(
      "https://picsum.photos/seed/x/640/800",
    );
  });

  it("presigned GET 풀 URL(쿼리 서명 포함)은 그대로 패스스루한다", () => {
    const presigned =
      "https://team02-letsgpt-images.s3.ap-northeast-2.amazonaws.com/images/uuid.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc";
    expect(resolveImageSrc(presigned)).toBe(presigned);
  });

  it("BE 객체 키는 이미지 조회 URL 로 변환한다", () => {
    const expected = new URL(
      "/api/v1/products/images/abc.jpg",
      import.meta.env.VITE_API_BASE_URL,
    ).toString();
    expect(resolveImageSrc("abc.jpg")).toBe(expected);
  });

  it("빈 값은 null", () => {
    expect(resolveImageSrc(null)).toBeNull();
    expect(resolveImageSrc("")).toBeNull();
  });
});

describe("buildGallery", () => {
  it("imageKeys 가 있으면 [thumbnail, ...imageKeys] 패스스루(중복 제거)", () => {
    expect(buildGallery("a.jpg", ["a.jpg", "b.jpg", "c.jpg"])).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("imageKeys 가 없으면 단일 썸네일에서 변형 컷을 모사", () => {
    const gallery = buildGallery("https://picsum.photos/seed/openat-1/640/800");
    expect(gallery.length).toBeGreaterThan(1);
    expect(gallery[0]).toBe("https://picsum.photos/seed/openat-1/640/800");
  });
});

import { describe, expect, it } from "vitest";

import { uploadProductImage } from "./products.api";

describe("상품 이미지 업로드 (multipart + MSW)", () => {
  it("파일을 업로드하면 저장 key·조회 url 을 돌려준다", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" });

    const result = await uploadProductImage(file);

    expect(result.key).toMatch(/\.jpg$/);
    expect(result.url).toContain(`/api/v1/products/images/${result.key}`);
  });
});

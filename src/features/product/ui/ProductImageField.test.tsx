import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { useState } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/store/authStore";
import { IMAGE_MAX_BYTES } from "@/features/product/model/product.schema";
import { server } from "@/mocks/server";
import { ProductImageField } from "./ProductImageField";

const S3_STAGING_ORIGIN = "https://team02-letsgpt-bucket.s3.ap-northeast-2.amazonaws.com";
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/webp": "webp" };
const NativeURL = URL;
const createObjectURLMock = vi.fn((object: Blob | MediaSource) => {
  return object instanceof File ? `blob:${object.name}` : "blob:preview";
});
const revokeObjectURLMock = vi.fn();

class TestURL extends NativeURL {
  static override createObjectURL(object: Blob | MediaSource): string {
    return createObjectURLMock(object);
  }

  static override revokeObjectURL(url: string): void {
    revokeObjectURLMock(url);
  }
}

function ProductImageFieldHarness() {
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState("");

  return (
    <>
      <ProductImageField
        sellerInfoId="s-1"
        images={images}
        onImagesChange={setImages}
        thumbnail={thumbnail}
        onThumbnailChange={setThumbnail}
      />
      <output data-testid="image-keys">{JSON.stringify(images)}</output>
      <output data-testid="thumbnail-key">{thumbnail}</output>
    </>
  );
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("이미지 파일 입력을 찾을 수 없습니다.");
  }
  return input;
}

function trackPresignRequests(): () => number {
  let requestCount = 0;
  server.use(
    http.post("*/api/v1/products/images/presign", () => {
      requestCount += 1;
      return HttpResponse.json({
        stagingKey: "staging/unexpected.png",
        uploadUrl: `${S3_STAGING_ORIGIN}/staging/unexpected.png?X-Amz-Signature=mock`,
        expiresAt: new Date().toISOString(),
      });
    }),
  );
  return () => requestCount;
}

beforeAll(() => {
  vi.stubGlobal("URL", TestURL);
});

beforeEach(() => {
  createObjectURLMock.mockClear();
  revokeObjectURLMock.mockClear();
  useAuthStore.setState({
    accessToken: "member-token",
    sellerToken: "seller-token",
    sellerTokenStoreId: "s-1",
    sellerTokenExpiresAt: Date.now() + 60_000,
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("ProductImageField", () => {
  it("허용하지 않는 이미지 형식은 presign 전에 거부한다", async () => {
    const getPresignRequestCount = trackPresignRequests();
    const { container } = render(<ProductImageFieldHarness />);
    const file = new File([new Uint8Array([1])], "animated.gif", { type: "image/gif" });

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "JPEG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다.",
    );
    expect(getPresignRequestCount()).toBe(0);
    expect(screen.getByTestId("image-keys")).toHaveTextContent("[]");
  });

  it("크기 상한을 넘는 이미지는 presign 전에 거부한다", async () => {
    const getPresignRequestCount = trackPresignRequests();
    const { container } = render(<ProductImageFieldHarness />);
    const file = new File([new Uint8Array(IMAGE_MAX_BYTES + 1)], "large.png", {
      type: "image/png",
    });

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "이미지는 파일당 5MB 이하만 업로드할 수 있습니다.",
    );
    expect(getPresignRequestCount()).toBe(0);
    expect(screen.getByTestId("image-keys")).toHaveTextContent("[]");
  });

  it("presign과 PUT 후 staging key를 보관하고 blob URL을 정리한다", async () => {
    const user = userEvent.setup();
    const presignRequests: Array<{ contentType: string }> = [];
    const putRequests: Array<{ url: string; contentType: string | null }> = [];
    server.use(
      http.post("*/api/v1/products/images/presign", async ({ request }) => {
        const body = (await request.json()) as { contentType: string };
        presignRequests.push(body);
        // BE 처럼 확장자를 contentType 으로 정하고, 업로드 URL 에만 스토리지 prefix 를 붙인다.
        const extension = EXTENSIONS[body.contentType];
        const stagingKey = `staging/${extension}-object.${extension}`;
        return HttpResponse.json({
          stagingKey,
          uploadUrl: `${S3_STAGING_ORIGIN}/images/${stagingKey}?X-Amz-Signature=mock`,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
      }),
      http.put(`${S3_STAGING_ORIGIN}/*`, ({ request }) => {
        putRequests.push({
          url: request.url,
          contentType: request.headers.get("Content-Type"),
        });
        return new HttpResponse(null, { status: 200 });
      }),
    );
    const { container, unmount } = render(<ProductImageFieldHarness />);
    const firstFile = new File([new Uint8Array([1])], "front.png", { type: "image/png" });
    const secondFile = new File([new Uint8Array([2])], "side.webp", { type: "image/webp" });

    await user.upload(getFileInput(container), [firstFile, secondFile]);

    await waitFor(() => {
      expect(screen.getByTestId("image-keys")).toHaveTextContent(
        JSON.stringify(["staging/png-object.png", "staging/webp-object.webp"]),
      );
    });
    expect(screen.getByTestId("thumbnail-key")).toHaveTextContent("staging/png-object.png");
    expect(presignRequests).toHaveLength(2);
    expect(presignRequests).toEqual(
      expect.arrayContaining([{ contentType: "image/png" }, { contentType: "image/webp" }]),
    );
    expect(putRequests).toHaveLength(2);
    expect(putRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ contentType: "image/png" }),
        expect.objectContaining({ contentType: "image/webp" }),
      ]),
    );
    expect(
      screen.getAllByRole("img", { name: "상품 이미지" }).map((image) => image.getAttribute("src")),
    ).toEqual(["blob:front.png", "blob:side.webp"]);

    const firstDeleteButton = screen.getAllByRole("button", { name: "이미지 삭제" }).at(0);
    if (!firstDeleteButton) {
      throw new Error("삭제 버튼을 찾을 수 없습니다.");
    }
    await user.click(firstDeleteButton);

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:front.png");
    expect(screen.getByTestId("image-keys")).toHaveTextContent(
      JSON.stringify(["staging/webp-object.webp"]),
    );
    expect(screen.getByTestId("thumbnail-key")).toHaveTextContent("staging/webp-object.webp");

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:side.webp");
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(2);
  });
});

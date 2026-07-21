import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { resolveSellerAuth } from "@/features/auth/api/auth.api";
import { presignProductImage, uploadToS3 } from "@/features/product/api/products.api";
import { IMAGE_ALLOWED_TYPES, IMAGE_MAX_BYTES } from "@/features/product/model/product.schema";
import { cn } from "@/shared/lib/utils";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";

type Props = {
  /** 업로드는 판매자 스토어 범위 토큰으로 인증 → 어느 스토어로 올릴지(sellerInfoId) 필요. */
  sellerInfoId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  thumbnail: string;
  onThumbnailChange: (key: string) => void;
};

type ImagePreview = {
  key: string;
  previewSrc: string;
};

function validateImages(files: readonly File[]): string | null {
  if (files.some((file) => !IMAGE_ALLOWED_TYPES.some((type) => type === file.type))) {
    return "JPEG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다.";
  }
  if (files.some((file) => file.size > IMAGE_MAX_BYTES)) {
    return `이미지는 파일당 ${IMAGE_MAX_BYTES / 1024 / 1024}MB 이하만 업로드할 수 있습니다.`;
  }
  return null;
}

/**
 * 상품 이미지 관리 — presign 발급 후 staging 에 직접 업로드하고 대표(썸네일)를 선택.
 * 부모에는 staging key 만 전달하고, 신규 이미지는 승격 전까지 blob URL 로 미리보기한다.
 * 기존 key 는 ImagePlaceholder(resolveImageSrc)가 기존 조회 URL로 변환해 렌더한다.
 */
export function ProductImageField({
  sellerInfoId,
  images,
  onImagesChange,
  thumbnail,
  onThumbnailChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const objectUrlsRef = useRef(new Set<string>());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const objectUrls = objectUrlsRef.current;
    return () => {
      mountedRef.current = false;
      for (const objectUrl of objectUrls) {
        URL.revokeObjectURL(objectUrl);
      }
      objectUrls.clear();
    };
  }, []);

  function revokePreview(previewSrc: string) {
    if (objectUrlsRef.current.delete(previewSrc)) {
      URL.revokeObjectURL(previewSrc);
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    const files = Array.from(fileList);
    setError(null);
    const validationError = validateImages(files);
    if (validationError) {
      setError(validationError);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    const createdPreviews: ImagePreview[] = [];
    try {
      // 한 번 확보한 판매자 토큰을 묶음 업로드에 공유(만료 시 각 요청의 reauth 가 재발급·재시도).
      const auth = await resolveSellerAuth(sellerInfoId);
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const { stagingKey, uploadUrl } = await presignProductImage(
            { contentType: file.type },
            auth,
          );
          await uploadToS3(uploadUrl, file);
          return { key: stagingKey, file };
        }),
      );

      if (!mountedRef.current) {
        return;
      }

      for (const { key, file } of uploaded) {
        const previewSrc = URL.createObjectURL(file);
        objectUrlsRef.current.add(previewSrc);
        createdPreviews.push({ key, previewSrc });
      }

      const next = [...images];
      const nextPreviews: ImagePreview[] = [];
      for (const preview of createdPreviews) {
        const { key } = preview;
        if (!next.includes(key)) {
          next.push(key);
          nextPreviews.push(preview);
        } else {
          revokePreview(preview.previewSrc);
        }
      }
      setImagePreviews((current) => [...current, ...nextPreviews]);
      onImagesChange(next);
      const first = next[0];
      if (!thumbnail && first) {
        onThumbnailChange(first);
      }
    } catch {
      for (const { previewSrc } of createdPreviews) {
        revokePreview(previewSrc);
      }
      if (mountedRef.current) {
        setError("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
      }
    } finally {
      if (mountedRef.current) {
        setUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    }
  }

  function removeImage(key: string) {
    const preview = imagePreviews.find((item) => item.key === key);
    if (preview) {
      revokePreview(preview.previewSrc);
      setImagePreviews((current) => current.filter((item) => item.key !== key));
    }
    const next = images.filter((item) => item !== key);
    onImagesChange(next);
    if (thumbnail === key) {
      onThumbnailChange(next[0] ?? "");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">이미지</span>
        <span className="text-muted-foreground text-xs">대표 이미지가 썸네일로 사용됩니다</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ALLOWED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
        }}
      />

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((key) => {
            const isThumb = key === thumbnail;
            const previewSrc = imagePreviews.find((item) => item.key === key)?.previewSrc;
            return (
              <div
                key={key}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border",
                  isThumb ? "border-foreground ring-1 ring-foreground" : "border-border",
                )}
              >
                <ImagePlaceholder name="상품 이미지" src={previewSrc ?? key} />
                {isThumb ? (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-background/85 px-2 py-0.5 font-medium text-[0.65rem] backdrop-blur">
                    대표
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onThumbnailChange(key)}
                    className="absolute inset-x-0 bottom-0 bg-background/85 py-1 text-[0.7rem] text-muted-foreground opacity-0 backdrop-blur transition hover:text-foreground group-hover:opacity-100"
                  >
                    대표로 설정
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(key)}
                  aria-label="이미지 삭제"
                  className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-background/85 text-muted-foreground opacity-0 backdrop-blur transition hover:text-destructive group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="grid aspect-square place-items-center rounded-lg border border-border border-dashed text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-60"
          >
            <span className="flex flex-col items-center gap-1 text-xs">
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ImagePlus className="size-5" />
              )}
              {uploading ? "업로드 중" : "추가"}
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-2 rounded-lg border border-border border-dashed py-10 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <ImagePlus className="size-6" />
          )}
          <span className="text-sm">{uploading ? "업로드 중…" : "이미지 추가"}</span>
        </button>
      )}

      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

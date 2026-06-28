import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { uploadProductImage } from "@/features/product/api/products.api";
import { cn } from "@/shared/lib/utils";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";

type Props = {
  images: string[];
  onImagesChange: (images: string[]) => void;
  thumbnail: string;
  onThumbnailChange: (key: string) => void;
};

/**
 * 상품 이미지 관리 — 파일을 업로드(BE 이미지 저장)하고 대표(썸네일)를 선택.
 * 업로드 → `{ key }` 수신 → key 를 images/thumbnail 로 보관(상품 write 시 thumbnailKey·imageKeys 로 전송).
 * key 는 ImagePlaceholder(resolveImageSrc)가 이미지 조회 URL로 변환해 렌더한다.
 */
export function ProductImageField({ images, onImagesChange, thumbnail, onThumbnailChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(
        Array.from(fileList).map((file) => uploadProductImage(file)),
      );
      const next = [...images];
      for (const { key } of uploaded) {
        if (!next.includes(key)) {
          next.push(key);
        }
      }
      onImagesChange(next);
      const first = next[0];
      if (!thumbnail && first) {
        onThumbnailChange(first);
      }
    } catch {
      setError("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function removeImage(key: string) {
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
        accept="image/*"
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
            return (
              <div
                key={key}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border",
                  isThumb ? "border-foreground ring-1 ring-foreground" : "border-border",
                )}
              >
                <ImagePlaceholder name="상품 이미지" src={key} />
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

      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

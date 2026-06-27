import { ImagePlus, Star, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { Input } from "@/shared/ui/input";

const SAMPLE_SEEDS = ["sneaker", "hoodie", "bag", "toy", "ceramic", "cap"];
const sampleUrl = (seed: string) => `https://picsum.photos/seed/openat-${seed}/640/800`;

type Props = {
  images: string[];
  onImagesChange: (images: string[]) => void;
  thumbnail: string;
  onThumbnailChange: (url: string) => void;
};

/**
 * 상품 이미지 관리 — 모달에서 여러 이미지를 추가하고 대표(썸네일)를 선택.
 * BE 는 thumbnailKey(단일)만 저장 → 추가 이미지는 FE 상태(provisional). [TODO(fe-api) 갤러리]
 */
export function ProductImageField({ images, onImagesChange, thumbnail, onThumbnailChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function addImage(url: string) {
    const value = url.trim();
    if (!value || images.includes(value)) {
      return;
    }
    onImagesChange([...images, value]);
    if (!thumbnail) {
      onThumbnailChange(value);
    }
  }

  function removeImage(url: string) {
    const next = images.filter((item) => item !== url);
    onImagesChange(next);
    if (thumbnail === url) {
      onThumbnailChange(next[0] ?? "");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">이미지</span>
        <span className="text-muted-foreground text-xs">대표 이미지가 썸네일로 사용됩니다</span>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((url) => {
            const isThumb = url === thumbnail;
            return (
              <div
                key={url}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border",
                  isThumb ? "border-foreground ring-1 ring-foreground" : "border-border",
                )}
              >
                <ImagePlaceholder name="상품 이미지" src={url} />
                {isThumb ? (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-background/85 px-2 py-0.5 font-medium text-[0.65rem] backdrop-blur">
                    대표
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onThumbnailChange(url)}
                    className="absolute inset-x-0 bottom-0 bg-background/85 py-1 text-[0.7rem] text-muted-foreground opacity-0 backdrop-blur transition hover:text-foreground group-hover:opacity-100"
                  >
                    대표로 설정
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
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
            onClick={() => setOpen(true)}
            className="grid aspect-square place-items-center rounded-lg border border-border border-dashed text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus className="size-5" />
              추가
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full flex-col items-center gap-2 rounded-lg border border-border border-dashed py-10 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <ImagePlus className="size-6" />
          <span className="text-sm">이미지 추가</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미지 추가</DialogTitle>
            <DialogDescription>
              이미지 URL 또는 객체 키를 추가하고 대표 이미지를 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              addImage(draft);
              setDraft("");
            }}
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="https://… 또는 products/2026/abc.jpg"
            />
            <Button type="submit" disabled={draft.trim() === ""}>
              추가
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">샘플 이미지</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  aria-label={`샘플 이미지 추가 ${seed}`}
                  onClick={() => addImage(sampleUrl(seed))}
                  className="size-12 overflow-hidden rounded-md border border-border transition hover:opacity-80"
                >
                  <img
                    src={sampleUrl(seed)}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          {images.length > 0 ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">추가된 이미지 ({images.length})</p>
              <div className="grid grid-cols-4 gap-2">
                {images.map((url) => {
                  const isThumb = url === thumbnail;
                  return (
                    <div
                      key={url}
                      className={cn(
                        "group relative aspect-square overflow-hidden rounded-md border",
                        isThumb ? "border-foreground ring-1 ring-foreground" : "border-border",
                      )}
                    >
                      <ImagePlaceholder name="상품 이미지" src={url} />
                      <button
                        type="button"
                        onClick={() => onThumbnailChange(url)}
                        aria-label="대표로 설정"
                        title="대표로 설정"
                        className={cn(
                          "absolute top-1 left-1 grid size-6 place-items-center rounded-full backdrop-blur transition",
                          isThumb
                            ? "bg-foreground text-background"
                            : "bg-background/85 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Star className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        aria-label="삭제"
                        className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-background/85 text-muted-foreground opacity-0 backdrop-blur transition hover:text-destructive group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="button" onClick={() => setOpen(false)}>
              완료
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

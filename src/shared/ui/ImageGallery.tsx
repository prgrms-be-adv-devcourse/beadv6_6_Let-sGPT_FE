import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";

/** 상세 화면 이미지 갤러리 — 큰 메인(4:5) + 썸네일 스트립. 이미지 없으면 플레이스홀더. */
export function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const main = images[selected];

  return (
    <div className="space-y-3">
      <div className="aspect-[4/5] overflow-hidden rounded-lg bg-surface">
        <ImagePlaceholder name={name} src={main ?? null} />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`이미지 ${index + 1}`}
              aria-pressed={index === selected}
              className={cn(
                "aspect-square overflow-hidden rounded-md bg-surface ring-1 ring-inset transition-colors",
                index === selected ? "ring-foreground" : "ring-border hover:ring-foreground/40",
              )}
            >
              <ImagePlaceholder name={name} src={src} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

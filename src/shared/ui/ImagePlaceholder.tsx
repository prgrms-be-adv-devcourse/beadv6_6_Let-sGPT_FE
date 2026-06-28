import { resolveImageSrc } from "@/shared/lib/image";
import { cn } from "@/shared/lib/utils";

/**
 * 상품/드롭 이미지 영역.
 * - `src`(thumbnailKey/imageKey 또는 URL) 가 있으면 실제 이미지(cover)로 렌더.
 *   BE 객체 키는 resolveImageSrc 가 이미지 조회 URL로 변환(풀 URL은 그대로).
 * - 없으면 웜 그라데이션 + 큰 세리프 이니셜의 "의도된 빈자리".
 */
export function ImagePlaceholder({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const resolved = resolveImageSrc(src);
  if (resolved) {
    return (
      <img
        src={resolved}
        alt={name}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  const initial = name.trim().charAt(0) || "?";
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-muted",
        className,
      )}
      aria-hidden
    >
      <span className="select-none font-serif text-7xl text-foreground/10">{initial}</span>
    </div>
  );
}

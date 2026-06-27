import { cn } from "@/shared/lib/utils";

/**
 * 상품/드롭 이미지 영역.
 * - `src`(thumbnail) 가 있으면 실제 이미지(cover)로 렌더.
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
  if (src) {
    return (
      <img
        src={src}
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

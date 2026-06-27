import { cn } from "@/shared/lib/utils";

/**
 * 상품/드롭 이미지 영역의 공통 플레이스홀더.
 * 실제 thumbnail 연결 전까지 웜 그라데이션 + 큰 세리프 이니셜로 "의도된 빈자리"를 채운다.
 * thumbnail 이 생기면 이 자리를 <img> 로 교체.
 */
export function ImagePlaceholder({ name, className }: { name: string; className?: string }) {
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

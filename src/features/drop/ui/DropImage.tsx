import { cn } from "@/shared/lib/utils";

/**
 * 드롭 상품 이미지 영역.
 * 실제 thumbnailKey 연결 전까지는 에디토리얼 플레이스홀더(웜 그라데이션 + 큰 세리프 이니셜)로 채워
 * 이미지 우선 레이아웃이 비어 보이지 않게 한다. thumbnailKey 가 생기면 <img> 로 교체.
 */
export function DropImage({ name, className }: { name: string; className?: string }) {
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

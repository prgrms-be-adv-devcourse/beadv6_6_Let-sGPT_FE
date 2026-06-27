import { cn } from "@/shared/lib/utils";

export type SegmentOption = { value: string; label: string };

type Props = {
  options: readonly SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  /** solid: 연결된 트랙(주 필터, 예: 상태) · underline: 텍스트 탭(보조 필터, 예: 카테고리) */
  variant?: "solid" | "underline";
  className?: string;
  "aria-label"?: string;
};

/**
 * 선택형 필터 공용 컨트롤.
 * - solid: iOS형 세그먼트(뮤트 트랙 + 활성 캡슐) → 상호배타 주 필터.
 * - underline: 미니멀 텍스트 탭(활성 언더라인) → 카테고리 등 보조 필터.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  variant = "solid",
  className,
  ...rest
}: Props) {
  if (variant === "underline") {
    return (
      <div
        role="tablist"
        aria-label={rest["aria-label"]}
        className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative shrink-0 whitespace-nowrap pb-1.5 text-sm transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn("inline-flex items-center gap-1 rounded-full bg-muted p-1", className)}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

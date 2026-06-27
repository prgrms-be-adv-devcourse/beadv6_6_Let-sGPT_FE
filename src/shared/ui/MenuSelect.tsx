import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";
import type { SegmentOption } from "./SegmentedControl";

type Props = {
  options: readonly SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  /** responsive(기본): 모바일=좌측 기준, lg=우측 기준 — 화면 밖으로 잘리지 않게. */
  align?: "left" | "right" | "responsive";
  className?: string;
  "aria-label"?: string;
};

const ALIGN_CLASS: Record<NonNullable<Props["align"]>, string> = {
  left: "left-0",
  right: "right-0",
  responsive: "left-0 lg:right-0 lg:left-auto",
};

/**
 * 모던 커스텀 드롭다운(네이티브 select 대체). 고스트 텍스트 트리거(라벨이 셰브론에 붙는 우측 정렬) +
 * 팝오버 메뉴(둥근 카드·호버·선택 체크). 외부 클릭/Esc 로 닫힘.
 */
export function MenuSelect({
  options,
  value,
  onChange,
  align = "responsive",
  className,
  ...rest
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={rest["aria-label"]}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <span className="text-foreground">{selected?.label ?? ""}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="listbox"
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-50 min-w-[10rem] rounded-xl border border-border bg-background p-1 shadow-lg",
            "fade-in-0 zoom-in-95 slide-in-from-top-1 animate-in duration-150",
            ALIGN_CLASS[align],
          )}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {option.label}
                {active ? <Check className="size-4" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

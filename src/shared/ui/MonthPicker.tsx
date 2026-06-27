import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

type Props = {
  /** "YYYYMM" 또는 "" (전체). */
  value: string;
  onChange: (value: string) => void;
  align?: "left" | "right" | "responsive";
  className?: string;
  "aria-label"?: string;
};

const ALIGN_CLASS: Record<NonNullable<Props["align"]>, string> = {
  left: "left-0",
  right: "right-0",
  responsive: "left-0 lg:right-0 lg:left-auto",
};

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const pad = (month: number) => month.toString().padStart(2, "0");

function fallbackYear(): number {
  return new Date().getFullYear();
}

/** 모던 달력형 월 선택기 — 연도 이동(◀ ▶) + 12개월 그리드 팝오버. "" 는 전체 월. */
export function MonthPicker({ value, onChange, align = "left", className, ...rest }: Props) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => (value ? Number(value.slice(0, 4)) : fallbackYear()));
  const ref = useRef<HTMLDivElement>(null);

  const selectedYear = value ? Number(value.slice(0, 4)) : null;
  const selectedMonth = value ? Number(value.slice(4)) : null;
  const label = value ? `${value.slice(0, 4)}.${value.slice(4)}` : "전체 월";

  // 열 때마다 선택값 기준 연도로 맞춤.
  useEffect(() => {
    if (open) {
      setYear(value ? Number(value.slice(0, 4)) : fallbackYear());
    }
  }, [open, value]);

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
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <Calendar className="size-4" />
        <span className={value ? "text-foreground" : undefined}>{label}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-50 w-64 rounded-xl border border-border bg-background p-3 shadow-lg",
            "fade-in-0 zoom-in-95 slide-in-from-top-1 animate-in duration-150",
            ALIGN_CLASS[align],
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="이전 해"
              onClick={() => setYear((current) => current - 1)}
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-medium text-sm tabular-nums">{year}년</span>
            <button
              type="button"
              aria-label="다음 해"
              onClick={() => setYear((current) => current + 1)}
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((month) => {
              const active = selectedYear === year && selectedMonth === month;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => {
                    onChange(`${year}${pad(month)}`);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-md py-2 text-sm transition-colors",
                    active
                      ? "bg-foreground font-medium text-background"
                      : "text-foreground hover:bg-surface",
                  )}
                >
                  {month}월
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "mt-2 w-full rounded-md py-2 text-sm transition-colors hover:bg-surface",
              value ? "text-muted-foreground" : "font-medium text-foreground",
            )}
          >
            전체 월
          </button>
        </div>
      ) : null}
    </div>
  );
}

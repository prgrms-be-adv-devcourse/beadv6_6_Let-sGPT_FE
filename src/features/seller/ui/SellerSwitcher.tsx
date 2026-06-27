import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { useMySellerInfos } from "../api/sellers.queries";

/**
 * 헤더 판매자(스토어) 전환기 — 회원이 가진 여러 SellerInfo 중 활성 스토어를 고른다.
 * 노출은 호출부(SiteHeader)에서 ROLE_SELLER 로 게이팅. 데이터는 /api/v1/seller/me.
 * 트리거 우측에 헤어라인 구분선을 함께 렌더(스토어 없으면 둘 다 미노출).
 */
export function SellerSwitcher() {
  const { data } = useMySellerInfos();
  const stores = data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (stores.length === 0) return null;

  // 활성 스토어를 기본 선택값으로(없으면 첫 항목).
  // TODO(fe-api): 서버 활성 스토어 전환 엔드포인트 연동 — 현재 선택은 헤더 클라이언트 상태.
  const active =
    stores.find((store) => store.id === selectedId) ??
    stores.find((store) => store.active) ??
    stores[0];
  if (!active) return null;

  return (
    <>
      <div ref={ref} className="relative hidden sm:block">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <span className="max-w-[10rem] truncate">{active.storeName}</span>
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </button>
        {open ? (
          <div className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-72 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg duration-150 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1">
            <p className="px-2.5 pt-1 pb-2 text-[0.7rem] text-muted-foreground uppercase tracking-[0.18em]">
              스토어 전환
            </p>
            <div className="space-y-0.5">
              {stores.map((store) => {
                const selected = store.id === active.id;
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(store.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent",
                      selected && "bg-accent",
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface font-serif text-foreground text-sm">
                      {store.storeName.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{store.storeName}</span>
                      <span className="block truncate text-muted-foreground text-xs tabular-nums">
                        사업자 {store.businessNumber}
                      </span>
                    </span>
                    {selected ? <Check className="size-4 shrink-0 text-foreground" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="my-1 h-px bg-border" />
            <Link
              to="/mypage"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
            >
              <Plus className="size-4 text-muted-foreground" />
              스토어 추가
            </Link>
          </div>
        ) : null}
      </div>
      <span className="hidden h-4 w-px bg-border sm:block" />
    </>
  );
}

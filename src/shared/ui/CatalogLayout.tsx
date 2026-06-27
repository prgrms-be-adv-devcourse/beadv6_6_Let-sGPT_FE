import { SearchIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

/**
 * 목록(상품·드롭) 공통 카탈로그 레이아웃.
 * - 좌측(고정): 카테고리 사이드바 + 그 아래 "필터" 버튼.
 * - 상단: 좌측 상태(슬롯) / 우측 "검색" 버튼(누르면 인라인 검색창).
 * - 필터 버튼 → 오른쪽 시트(정렬 등). lg 미만에선 시트 안에 카테고리도 노출.
 */
export function CatalogLayout({
  eyebrow,
  title,
  sidebar,
  statusBar,
  filterDrawer,
  searchValue,
  onSearchChange,
  searchPlaceholder = "검색",
  resultCount,
  children,
}: {
  eyebrow: string;
  title: string;
  sidebar: ReactNode;
  statusBar?: ReactNode;
  filterDrawer: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  resultCount?: number | undefined;
  children: ReactNode;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const countLabel =
    resultCount === undefined ? null : (
      <p className="text-muted-foreground text-sm tabular-nums">{resultCount}개</p>
    );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">{eyebrow}</p>
        <h1 className="font-serif text-4xl tracking-tight">{title}</h1>
      </header>

      <div className="flex gap-10">
        <aside className="hidden w-44 shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            {sidebar}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setFilterOpen(true)}
            >
              필터
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex items-center justify-between gap-4 border-border border-b pb-4">
            <div className="min-w-0">{statusBar ?? countLabel}</div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setFilterOpen(true)}
              >
                필터
              </Button>
              <Button
                variant={searchOpen ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSearchOpen((open) => !open)}
                aria-expanded={searchOpen}
              >
                <SearchIcon className="size-4" />
                검색
              </Button>
            </div>
          </div>

          {searchOpen ? (
            <Input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="max-w-xs"
            />
          ) : null}

          {statusBar && resultCount !== undefined ? countLabel : null}

          {children}
        </div>
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>필터</SheetTitle>
          </SheetHeader>
          <div className="space-y-8 overflow-y-auto px-4 pb-6">
            <div className="lg:hidden">{sidebar}</div>
            {filterDrawer}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

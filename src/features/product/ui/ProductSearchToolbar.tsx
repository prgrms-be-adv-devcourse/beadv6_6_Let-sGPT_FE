import { Search } from "lucide-react";
import { useState } from "react";

import type { Category } from "@/features/category/model/category.schema";
import type { ProductSearchSort } from "@/features/product/model/product-search.schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { MenuSelect } from "@/shared/ui/MenuSelect";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";

export type ProductSearchValues = {
  query: string | null;
  startPrice: number | null;
  endPrice: number | null;
  sort: ProductSearchSort;
};

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "최신순" },
  { value: "price,asc", label: "가격 낮은순" },
  { value: "price,desc", label: "가격 높은순" },
] as const;

type ProductSearchToolbarProps = {
  categories: Category[];
  categoryName: string | null;
  isSearching: boolean;
  onCategoryChange: (categoryName: string | null) => void;
  onSearch: (values: ProductSearchValues) => void;
};

function parsePrice(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

export function ProductSearchToolbar({
  categories,
  categoryName,
  isSearching,
  onCategoryChange,
  onSearch,
}: ProductSearchToolbarProps) {
  const [startPrice, setStartPrice] = useState("");
  const [endPrice, setEndPrice] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProductSearchSort>("createdAt,desc");
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = [
    { value: "", label: "전체" },
    ...categories.map((category) => ({ value: category.name, label: category.name })),
  ];

  function submitSearch() {
    const parsedStartPrice = parsePrice(startPrice);
    const parsedEndPrice = parsePrice(endPrice);

    if (
      (parsedStartPrice !== null &&
        (!Number.isInteger(parsedStartPrice) || parsedStartPrice < 0)) ||
      (parsedEndPrice !== null && (!Number.isInteger(parsedEndPrice) || parsedEndPrice < 0))
    ) {
      setError("가격은 0 이상의 정수로 입력해 주세요.");
      return;
    }
    if (parsedStartPrice !== null && parsedEndPrice !== null && parsedStartPrice > parsedEndPrice) {
      setError("최소 가격은 최대 가격보다 클 수 없습니다.");
      return;
    }

    setError(null);
    onSearch({
      query: query.trim() || null,
      startPrice: parsedStartPrice,
      endPrice: parsedEndPrice,
      sort,
    });
  }

  return (
    <div className="sticky top-16 z-30 -mx-6 space-y-3 border-border border-b bg-background/90 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <SegmentedControl
          aria-label="카테고리 필터"
          variant="underline"
          className="min-w-0 xl:flex-1"
          options={categoryOptions}
          value={categoryName ?? ""}
          onChange={(value) => onCategoryChange(value || null)}
        />

        <form
          className="flex min-w-0 flex-wrap items-center gap-2 xl:flex-nowrap"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <Input
            aria-label="최소 가격"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={startPrice}
            onChange={(event) => setStartPrice(event.target.value)}
            placeholder="최소 가격"
            className="w-[6.25rem] tabular-nums"
          />
          <span aria-hidden="true" className="text-muted-foreground">
            ~
          </span>
          <Input
            aria-label="최대 가격"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={endPrice}
            onChange={(event) => setEndPrice(event.target.value)}
            placeholder="최대 가격"
            className="w-[6.25rem] tabular-nums"
          />
          <div className="relative min-w-[12rem] flex-1 xl:w-[25rem]">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              aria-label="자연어 검색"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="자연어 검색"
              className="pl-9"
            />
          </div>
          <MenuSelect
            aria-label="정렬"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(value) => setSort(value as ProductSearchSort)}
            align="right"
            className="shrink-0"
          />
          <Button type="submit" disabled={isSearching} className="shrink-0">
            {isSearching ? "검색 중…" : "검색"}
          </Button>
        </form>
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

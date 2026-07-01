import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useCategories } from "@/features/category/api/categories.queries";
import { useProductList } from "@/features/product/api/products.queries";
import type { Product } from "@/features/product/model/product.schema";
import { formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { LoadingState } from "@/shared/ui/LoadingState";
import { MenuSelect } from "@/shared/ui/MenuSelect";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Tag } from "@/shared/ui/Tag";

export const Route = createFileRoute("/products/")({
  component: ProductListPage,
});

const SORTS = [
  { value: "latest", label: "최신순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

function sortProducts(list: Product[], sort: SortValue): Product[] {
  if (sort === "latest") return list;
  const copy = [...list];
  const sign = sort === "price-asc" ? 1 : -1;
  return copy.sort((a, b) => {
    if (a.price === null && b.price === null) return 0;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return (a.price - b.price) * sign;
  });
}

function ProductListPage() {
  const products = useProductList({ size: 50 });
  const categories = useCategories();
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<SortValue>("latest");

  const filtered = useMemo(() => {
    const term = keyword.trim();
    const base = (products.data?.content ?? []).filter((product) => {
      if (categoryId && product.categoryId !== categoryId) return false;
      if (term && !product.name.includes(term)) return false;
      return true;
    });
    return sortProducts(base, sort);
  }, [products.data, categoryId, keyword, sort]);

  const [cover, ...rest] = filtered;

  const categoryOptions = [
    { value: "", label: "전체" },
    ...(categories.data ?? []).map((category) => ({ value: category.id, label: category.name })),
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em]">Lookbook</p>
        <h1 className="font-serif text-5xl tracking-tight">전체 상품</h1>
        <p className="text-muted-foreground text-sm tabular-nums">
          {products.isPending ? "불러오는 중…" : `${filtered.length}개의 상품`}
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-6 flex flex-col gap-4 border-border border-b bg-background/85 px-6 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <SegmentedControl
          aria-label="카테고리 필터"
          variant="underline"
          className="lg:flex-1"
          options={categoryOptions}
          value={categoryId ?? ""}
          onChange={(value) => setCategoryId(value || undefined)}
        />
        <div className="flex shrink-0 items-center gap-5">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-0 size-4 text-muted-foreground" />
            <input
              aria-label="상품명 검색"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="상품명 검색"
              className="h-9 w-40 border-border border-b bg-transparent pr-2 pl-6 text-sm outline-none transition-colors focus-visible:border-foreground"
            />
          </div>
          <MenuSelect
            aria-label="정렬"
            options={SORTS}
            value={sort}
            onChange={(value) => setSort(value as SortValue)}
          />
        </div>
      </div>

      {products.isPending ? (
        <LoadingState label="상품을 불러오는 중" />
      ) : products.isError ? (
        <p className="py-16 text-center text-destructive text-sm">상품을 불러오지 못했습니다.</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground text-sm">
          조건에 맞는 상품이 없습니다.
        </p>
      ) : (
        <div className="space-y-10">
          {cover ? <CoverProduct product={cover} /> : null}
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
            {rest.map((product) => (
              <GalleryTile key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CoverProduct({ product }: { product: Product }) {
  return (
    <Link
      to="/products/$id"
      params={{ id: product.id }}
      className="group grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
          <ImagePlaceholder name={product.name} src={product.thumbnailKey} />
        </div>
        <span className="absolute top-4 left-4 rounded-full bg-background/85 px-3 py-1 font-medium text-xs uppercase tracking-[0.18em] backdrop-blur">
          Featured
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {product.categoryName ? <Tag>{product.categoryName}</Tag> : null}
          {product.sellerName ? (
            <span className="text-muted-foreground text-sm">{product.sellerName}</span>
          ) : null}
        </div>
        <h2 className="font-serif text-4xl leading-tight tracking-tight">{product.name}</h2>
        <p className="line-clamp-2 text-muted-foreground text-sm">{product.description}</p>
        <p className="pt-2 font-medium text-xl tabular-nums">
          {product.price === null ? (
            <span className="text-muted-foreground">가격 미정</span>
          ) : (
            formatKrw(product.price)
          )}
        </p>
        <Button asChild variant="outline" className="mt-2">
          <span>보러 가기 →</span>
        </Button>
      </div>
    </Link>
  );
}

function GalleryTile({ product }: { product: Product }) {
  return (
    <Link to="/products/$id" params={{ id: product.id }} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-surface">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <ImagePlaceholder name={product.name} src={product.thumbnailKey} />
        </div>
        {product.categoryName ? (
          <Tag className="absolute top-3 left-3 bg-background/75 text-foreground backdrop-blur">
            {product.categoryName}
          </Tag>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        {product.sellerName ? (
          <p className="truncate text-[0.7rem] text-muted-foreground uppercase tracking-[0.1em]">
            {product.sellerName}
          </p>
        ) : null}
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-medium text-sm">{product.name}</h3>
          <p className="shrink-0 text-sm tabular-nums">
            {product.price === null ? (
              <span className="text-muted-foreground">미정</span>
            ) : (
              formatKrw(product.price)
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { CategorySidebar } from "@/features/category/ui/CategorySidebar";
import { type ProductListParams, useProductList } from "@/features/product/api/products.queries";
import { ProductCard } from "@/features/product/ui/ProductCard";
import { CatalogLayout } from "@/shared/ui/CatalogLayout";
import { FilterChip } from "@/shared/ui/FilterChip";
import { Pagination } from "@/shared/ui/Pagination";

export const Route = createFileRoute("/products/")({
  component: ProductListPage,
});

const PAGE_SIZE = 8;

const SORT_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "최신순" },
  { value: "price,asc", label: "가격 낮은순" },
  { value: "price,desc", label: "가격 높은순" },
];

function ProductListPage() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);

  // 필터·검색·정렬을 바꾸면 항상 첫 페이지로.
  const update = (action: () => void) => {
    action();
    setPage(0);
  };

  const params: ProductListParams = {
    page,
    size: PAGE_SIZE,
    ...(categoryId ? { categoryId } : {}),
    ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
    ...(sort ? { sort } : {}),
  };
  const products = useProductList(params);

  const filterDrawer = (
    <div className="space-y-2">
      <p className="font-medium text-sm">정렬</p>
      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((option) => (
          <FilterChip
            key={option.label}
            active={sort === option.value}
            onClick={() => update(() => setSort(option.value))}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );

  return (
    <CatalogLayout
      eyebrow="Shop"
      title="전체 상품"
      sidebar={
        <CategorySidebar
          selectedId={categoryId}
          onSelect={(id) => update(() => setCategoryId(id))}
        />
      }
      filterDrawer={filterDrawer}
      searchValue={keyword}
      onSearchChange={(value) => update(() => setKeyword(value))}
      searchPlaceholder="상품명 검색"
      resultCount={products.data?.totalElements}
    >
      {products.isPending ? (
        <p className="py-10 text-muted-foreground text-sm">상품을 불러오는 중…</p>
      ) : null}
      {products.isError ? (
        <p className="py-10 text-destructive text-sm">상품을 불러오지 못했습니다.</p>
      ) : null}
      {products.data && products.data.content.length === 0 ? (
        <p className="py-10 text-muted-foreground text-sm">조건에 맞는 상품이 없습니다.</p>
      ) : null}
      {products.data && products.data.content.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
            {products.data.content.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination page={page} totalPages={products.data.totalPages} onPageChange={setPage} />
        </>
      ) : null}
    </CatalogLayout>
  );
}

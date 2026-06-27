import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useCategories } from "@/features/category/api/categories.queries";
import { type ProductListParams, useProductList } from "@/features/product/api/products.queries";
import { ProductCard } from "@/features/product/ui/ProductCard";
import { FilterChip } from "@/shared/ui/FilterChip";
import { Input } from "@/shared/ui/input";

export const Route = createFileRoute("/products/")({
  component: ProductListPage,
});

function ProductListPage() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const categories = useCategories();

  const params: ProductListParams = {
    ...(categoryId ? { categoryId } : {}),
    ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
  };
  const products = useProductList(params);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Shop</p>
        <h1 className="font-serif text-4xl tracking-tight">전체 상품</h1>
      </header>

      <div className="flex flex-col gap-4 border-border border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!categoryId} onClick={() => setCategoryId(undefined)}>
            전체
          </FilterChip>
          {categories.data?.map((category) => (
            <FilterChip
              key={category.id}
              active={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
            >
              {category.name}
            </FilterChip>
          ))}
        </div>
        <Input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="상품 검색"
          className="sm:w-64"
        />
      </div>

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
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm tabular-nums">
            {products.data.totalElements}개
          </p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.data.content.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

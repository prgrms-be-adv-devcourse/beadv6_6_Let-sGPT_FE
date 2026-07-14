import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { useCategories } from "@/features/category/api/categories.queries";
import {
  INITIAL_PRODUCT_SEARCH_REQUEST,
  type ProductSearchRequest,
  useProductSearch,
} from "@/features/product/api/product-search.queries";
import type { ProductSearchResult } from "@/features/product/model/product-search.schema";
import {
  ProductSearchToolbar,
  type ProductSearchValues,
} from "@/features/product/ui/ProductSearchToolbar";
import { formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Pagination } from "@/shared/ui/Pagination";
import { Tag } from "@/shared/ui/Tag";

export const Route = createFileRoute("/products_es/")({
  component: ProductEsPage,
});

function ProductEsPage() {
  const [request, setRequest] = useState<ProductSearchRequest>(INITIAL_PRODUCT_SEARCH_REQUEST);
  const products = useProductSearch(request);
  const categories = useCategories();
  const list = products.data?.content ?? [];
  const [cover, ...rest] = list;

  function changeCategory(categoryName: string | null) {
    setRequest((current) => ({ ...current, categoryName, page: 0 }));
  }

  function search(values: ProductSearchValues) {
    setRequest((current) => ({ ...current, ...values, page: 0 }));
  }

  function changePage(page: number) {
    setRequest((current) => ({ ...current, page }));
  }

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em]">Search edit</p>
        <h1 className="font-serif text-5xl tracking-tight">상품 검색</h1>
        <p className="text-muted-foreground text-sm tabular-nums">
          {products.isPending ? "불러오는 중…" : `${products.data?.totalElements ?? 0}개의 상품`}
        </p>
      </header>

      <ProductSearchToolbar
        categories={categories.data ?? []}
        categoryName={request.categoryName}
        isSearching={products.isFetching}
        onCategoryChange={changeCategory}
        onSearch={search}
      />

      {products.isPending ? (
        <LoadingState label="검색 상품을 불러오는 중" />
      ) : products.isError ? (
        <p className="py-16 text-center text-destructive text-sm">
          검색 결과를 불러오지 못했습니다.
        </p>
      ) : list.length === 0 ? (
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

      {!products.isPending && !products.isError && products.data ? (
        <footer className="border-border border-t pt-6">
          <p className="text-center text-muted-foreground text-sm tabular-nums">
            {products.data.totalPages === 0
              ? "0 / 0 페이지"
              : `${products.data.page + 1} / ${products.data.totalPages} 페이지`}
          </p>
          <Pagination
            page={products.data.page}
            totalPages={products.data.totalPages}
            onPageChange={changePage}
          />
        </footer>
      ) : null}
    </div>
  );
}

function CoverProduct({ product }: { product: ProductSearchResult }) {
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

function GalleryTile({ product }: { product: ProductSearchResult }) {
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

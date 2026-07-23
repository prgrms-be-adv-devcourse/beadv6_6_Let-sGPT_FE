import { createFileRoute, Link } from "@tanstack/react-router";

import { useProductsBySeller } from "@/features/product/api/products.queries";
import { ProductCard } from "@/features/product/ui/ProductCard";
import { LoadingState } from "@/shared/ui/LoadingState";

export const Route = createFileRoute("/brands/$name")({
  component: BrandPage,
});

function BrandPage() {
  const { name } = Route.useParams();
  const { data, isPending, isError } = useProductsBySeller(name);
  const products = data ?? [];

  return (
    <div className="space-y-8">
      <div className="border-border border-b pb-5">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Brand · 브랜드</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
          {name}
          {products.length > 0 ? (
            <span className="ml-2 align-top text-base text-muted-foreground tabular-nums">
              {products.length}
            </span>
          ) : null}
        </h1>
      </div>

      {isPending ? <LoadingState label="브랜드 상품을 불러오는 중" className="py-10" /> : null}
      {isError ? (
        <p className="py-10 text-muted-foreground text-sm">상품을 불러오지 못했습니다.</p>
      ) : null}
      {data && products.length === 0 ? (
        <p className="py-10 text-muted-foreground text-sm">이 브랜드의 상품이 없습니다.</p>
      ) : null}

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} to="/products/$id" params={{ id: product.id }} className="block">
              <ProductCard product={product} />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

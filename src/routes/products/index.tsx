import { createFileRoute } from "@tanstack/react-router";

import { useProductList } from "@/features/product/api/products.queries";
import { ProductCard } from "@/features/product/ui/ProductCard";

export const Route = createFileRoute("/products/")({
  component: ProductListPage,
});

function ProductListPage() {
  const { data, isPending, isError } = useProductList();

  if (isPending) {
    return <p className="text-muted-foreground">상품을 불러오는 중…</p>;
  }
  if (isError) {
    return <p className="text-destructive">상품을 불러오지 못했습니다.</p>;
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.content.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}

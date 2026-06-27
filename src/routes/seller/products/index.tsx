import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useMyProducts } from "@/features/product/api/products.queries";
import { SellerGuard } from "@/features/seller/ui/SellerGuard";
import { formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";

export const Route = createFileRoute("/seller/products/")({
  beforeLoad: () => {
    if (!useAuthStore.getState().member) {
      throw redirect({ to: "/login" });
    }
  },
  component: SellerProductsPage,
});

function SellerProductsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Seller</p>
          <h1 className="font-serif text-4xl tracking-tight">상품 관리</h1>
        </div>
        <Button asChild>
          <Link to="/seller/products/new">새 상품 등록</Link>
        </Button>
      </header>

      <SellerGuard>{() => <ProductList />}</SellerGuard>
    </div>
  );
}

function ProductList() {
  const products = useMyProducts({ page: 0, size: 50 });

  if (products.isPending) {
    return <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</p>;
  }
  if (products.isError) {
    return (
      <p className="py-16 text-center text-destructive text-sm">상품을 불러오지 못했습니다.</p>
    );
  }
  if (products.data.content.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground text-sm">등록된 상품이 없습니다.</p>
    );
  }

  return (
    <ul className="divide-y divide-border border-border border-y">
      {products.data.content.map((product) => (
        <li key={product.id}>
          <Link
            to="/seller/products/$id"
            params={{ id: product.id }}
            className="-mx-2 flex items-center gap-4 rounded-md px-2 py-4 transition-colors hover:bg-surface"
          >
            <div className="size-16 shrink-0 overflow-hidden rounded-md border">
              <ImagePlaceholder name={product.name} src={product.thumbnailKey} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-medium">{product.name}</p>
              <p className="text-muted-foreground text-xs">{product.categoryName ?? "미분류"}</p>
            </div>
            <span className="shrink-0 font-medium tabular-nums">
              {product.price === null ? "가격 미정" : formatKrw(product.price)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

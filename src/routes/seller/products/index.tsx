import { createFileRoute } from "@tanstack/react-router";

import { SellerProductList } from "@/features/product/ui/SellerProductList";
import { SellerGuard } from "@/features/seller/ui/SellerGuard";

export const Route = createFileRoute("/seller/products/")({
  component: SellerProductsPage,
});

function SellerProductsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Seller</p>
        <h1 className="font-serif text-4xl tracking-tight">상품 관리</h1>
      </header>

      <SellerGuard>{() => <SellerProductList />}</SellerGuard>
    </div>
  );
}

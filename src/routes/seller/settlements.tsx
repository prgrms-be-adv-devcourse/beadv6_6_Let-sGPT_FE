import { createFileRoute, Link } from "@tanstack/react-router";

import { SellerGuard } from "@/features/seller/ui/SellerGuard";
import { SettlementPanel } from "@/features/settlement/ui/SettlementPanel";

export const Route = createFileRoute("/seller/settlements")({
  component: SellerSettlementsPage,
});

function SellerSettlementsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Seller</p>
          <h1 className="font-serif text-4xl tracking-tight">정산 내역</h1>
        </div>
        <Link
          to="/seller/products"
          className="text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          상품 관리 →
        </Link>
      </header>

      <SellerGuard>
        {(sellerId) => <SettlementPanel scope="seller" sellerId={sellerId} />}
      </SellerGuard>
    </div>
  );
}

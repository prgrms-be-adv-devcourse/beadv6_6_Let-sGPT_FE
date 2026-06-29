import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useCreateProduct } from "@/features/product/api/products.queries";
import { toProductWriteBody } from "@/features/product/model/product.schema";
import { ProductForm } from "@/features/product/ui/ProductForm";
import { SellerGuard } from "@/features/seller/ui/SellerGuard";

export const Route = createFileRoute("/seller/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const create = useCreateProduct();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Seller</p>
        <h1 className="font-serif text-4xl tracking-tight">상품 등록</h1>
      </header>

      <SellerGuard>
        {(sellerInfoId) => (
          <ProductForm
            defaultValues={{
              name: "",
              description: "",
              categoryId: "",
              price: "",
              thumbnailKey: "",
            }}
            submitLabel="상품 등록"
            pending={create.isPending}
            errorMessage={create.isError ? create.error.message : undefined}
            onSubmit={(values, imageKeys) =>
              create.mutate(
                { sellerInfoId, body: toProductWriteBody(values, imageKeys) },
                { onSuccess: () => navigate({ to: "/seller/products" }) },
              )
            }
          />
        )}
      </SellerGuard>

      <Link
        to="/seller/products"
        className="block text-center text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        ← 상품 관리로
      </Link>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import {
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
} from "@/features/product/api/products.queries";
import {
  type Product,
  type ProductFormValues,
  toProductWriteBody,
} from "@/features/product/model/product.schema";
import { ProductForm } from "@/features/product/ui/ProductForm";
import { SellerGuard } from "@/features/seller/ui/SellerGuard";
import { Button } from "@/shared/ui/button";
import { LoadingState } from "@/shared/ui/LoadingState";

export const Route = createFileRoute("/seller/products/$id")({
  component: SellerProductDetailPage,
});

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    categoryId: product.categoryId ?? "",
    price: product.price === null ? "" : String(product.price),
    thumbnailKey: product.thumbnailKey ?? "",
  };
}

function SellerProductDetailPage() {
  const { id } = Route.useParams();

  return (
    <div className="mx-auto max-w-xl space-y-10">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Seller</p>
        <h1 className="font-serif text-4xl tracking-tight">상품 관리 상세</h1>
      </header>

      <SellerGuard>
        {(sellerInfoId) => <ProductManager id={id} sellerInfoId={sellerInfoId} />}
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

function ProductManager({ id, sellerInfoId }: { id: string; sellerInfoId: string }) {
  const navigate = useNavigate();
  const product = useProduct(id);
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  if (product.isPending) {
    return <LoadingState label="상품을 불러오는 중" />;
  }
  if (product.isError || !product.data) {
    return (
      <p className="py-16 text-center text-destructive text-sm">상품을 불러오지 못했습니다.</p>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="font-medium text-lg">상품 정보 수정</h2>
        <ProductForm
          sellerInfoId={sellerInfoId}
          defaultValues={toFormValues(product.data)}
          defaultImageKeys={product.data.imageKeys ?? []}
          submitLabel="수정 저장"
          pending={update.isPending}
          errorMessage={update.isError ? update.error.message : undefined}
          onSubmit={(values, imageKeys) =>
            update.mutate({ sellerInfoId, id, body: toProductWriteBody(values, imageKeys) })
          }
        />
        {update.isSuccess ? (
          <p className="text-muted-foreground text-sm">수정 사항이 저장되었습니다.</p>
        ) : null}
      </section>

      <section className="space-y-3 border-destructive/30 border-t pt-8">
        <h2 className="font-medium text-destructive text-lg">상품 삭제</h2>
        <p className="text-muted-foreground text-sm">오픈 중인 드롭이 있으면 삭제할 수 없습니다.</p>
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/5"
          disabled={remove.isPending}
          onClick={() =>
            remove.mutate(
              { sellerInfoId, id },
              { onSuccess: () => navigate({ to: "/seller/products" }) },
            )
          }
        >
          {remove.isPending ? "삭제 중…" : "상품 삭제"}
        </Button>
        {remove.isError ? <p className="text-destructive text-sm">{remove.error.message}</p> : null}
      </section>
    </div>
  );
}

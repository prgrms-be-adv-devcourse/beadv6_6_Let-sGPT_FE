import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { useMyProducts } from "@/features/product/api/products.queries";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { DropCreateForm } from "./DropCreateForm";

// 폼 컨트롤 스타일 — ProductForm 의 select/Input 결과 동일(에디토리얼 미니멀 일관).
const controlClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * 드롭 관리의 단일 등록 진입점 — "드롭 추가" → 본인 상품 선택 → 드롭 정보 입력.
 * 상품 상세의 드롭 생성을 대체(드롭 중심 동선). API 는 동일(POST /drops via DropCreateForm).
 */
export function DropCreateDialog({ sellerInfoId }: { sellerInfoId: string }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const products = useMyProducts(sellerInfoId, { page: 0, size: 50 });
  const items = products.data?.content ?? [];

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setProductId(""); // 닫힐 때 선택 초기화
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">드롭 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>드롭 추가</DialogTitle>
          <DialogDescription>상품을 선택하고 드롭 정보를 입력하세요.</DialogDescription>
        </DialogHeader>

        {products.isPending ? (
          <p className="py-8 text-center text-muted-foreground text-sm">상품을 불러오는 중…</p>
        ) : products.isError ? (
          <p className="py-8 text-center text-destructive text-sm">상품을 불러오지 못했습니다.</p>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">먼저 등록된 상품이 필요합니다.</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/seller/products/new" onClick={() => setOpen(false)}>
                상품 등록하기
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="drop-product" className="font-medium text-sm">
                상품
              </label>
              <select
                id="drop-product"
                className={controlClass}
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
              >
                <option value="">상품 선택</option>
                {items.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* key 로 상품 변경 시 드롭 폼을 초기화. 등록 성공 → 모달 닫기(목록은 무효화로 갱신). */}
            {productId ? (
              <DropCreateForm
                key={productId}
                productId={productId}
                sellerInfoId={sellerInfoId}
                onCreated={() => handleOpenChange(false)}
              />
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

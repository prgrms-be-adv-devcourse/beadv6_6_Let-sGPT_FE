import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { useMyProducts } from "@/features/product/api/products.queries";
import { formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { DropCreateForm } from "./DropCreateForm";

const sectionLabel = "font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]";

/**
 * 드롭 관리의 단일 등록 진입점 — "드롭 추가" → 본인 상품 선택 → 드롭 정보 입력.
 * 헤더/상품/드롭 정보를 헤어라인으로 가른 에디토리얼 미니멀 모달. API 는 동일(POST /drops).
 */
export function DropCreateDialog({ sellerInfoId }: { sellerInfoId: string }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const products = useMyProducts(sellerInfoId, { page: 0, size: 50 });
  const items = products.data?.content ?? [];
  const selected = items.find((product) => product.id === productId) ?? null;

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
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="gap-1.5 border-border border-b px-6 pt-6 pb-5">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Drop</p>
          <DialogTitle className="text-xl">드롭 추가</DialogTitle>
          <DialogDescription>상품을 고르고 한정 드롭 정보를 입력하세요.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6">
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
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className={sectionLabel}>상품</h3>
                <div className="relative">
                  <select
                    aria-label="상품 선택"
                    className="h-10 w-full appearance-none rounded-md border border-input bg-transparent pr-9 pl-3 text-sm outline-none transition-colors hover:border-foreground/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    value={productId}
                    onChange={(event) => setProductId(event.target.value)}
                  >
                    <option value="">상품을 선택하세요</option>
                    {items.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                {selected ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 p-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-md border">
                      <ImagePlaceholder name={selected.name} src={selected.thumbnailKey} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate font-medium text-sm">{selected.name}</p>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {selected.price === null
                          ? "정가 미정"
                          : `정가 ${formatKrw(selected.price)}`}
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>

              {/* key 로 상품 변경 시 드롭 폼 초기화. 등록 성공 → 모달 닫기(목록은 무효화로 갱신). */}
              {productId ? (
                <section className="space-y-4 border-border border-t pt-6">
                  <h3 className={sectionLabel}>드롭 정보</h3>
                  <DropCreateForm
                    key={productId}
                    productId={productId}
                    sellerInfoId={sellerInfoId}
                    onCreated={() => handleOpenChange(false)}
                  />
                </section>
              ) : (
                <p className="border-border border-t pt-6 text-center text-muted-foreground text-sm">
                  상품을 선택하면 드롭 정보를 입력할 수 있어요.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

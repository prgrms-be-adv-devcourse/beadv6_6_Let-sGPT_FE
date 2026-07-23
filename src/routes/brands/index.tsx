import { createFileRoute, Link } from "@tanstack/react-router";

import { useBrandNames } from "@/features/product/api/products.queries";
import { LoadingState } from "@/shared/ui/LoadingState";

export const Route = createFileRoute("/brands/")({
  component: BrandIndexPage,
});

function BrandIndexPage() {
  const { data, isPending, isError } = useBrandNames();
  const brands = data ?? [];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em]">Brands</p>
        <h1 className="font-serif text-5xl tracking-tight">브랜드</h1>
        <p className="text-muted-foreground text-sm tabular-nums">
          {isPending ? "불러오는 중…" : `${brands.length}개의 브랜드`}
        </p>
      </header>

      {isPending ? <LoadingState label="브랜드를 불러오는 중" className="py-10" /> : null}
      {isError ? (
        <p className="py-10 text-muted-foreground text-sm">브랜드를 불러오지 못했습니다.</p>
      ) : null}
      {data && brands.length === 0 ? (
        <p className="py-10 text-muted-foreground text-sm">등록된 브랜드가 없습니다.</p>
      ) : null}

      {brands.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((name) => (
            <Link
              key={name}
              to="/brands/$name"
              params={{ name }}
              className="group flex items-center gap-4 rounded-lg border border-border p-5 transition-colors hover:bg-surface"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-surface to-muted font-serif text-xl text-foreground/40">
                {name.trim().charAt(0) || "?"}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{name}</span>
                <span className="text-muted-foreground text-sm">상품 보기 →</span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

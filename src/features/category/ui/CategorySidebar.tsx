import { cn } from "@/shared/lib/utils";
import { useCategories } from "../api/categories.queries";

/** 좌측 고정 카테고리 필터(상품·드롭 목록 공용). 전체 + 카테고리 목록을 수직 리스트로 노출. */
export function CategorySidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
}) {
  const categories = useCategories();
  const items: { id: string | undefined; name: string }[] = [
    { id: undefined, name: "전체" },
    ...(categories.data ?? []),
  ];

  return (
    <nav className="space-y-0.5">
      <p className="mb-3 text-muted-foreground text-xs uppercase tracking-[0.18em]">카테고리</p>
      {items.map((item) => (
        <button
          key={item.id ?? "all"}
          type="button"
          onClick={() => onSelect(item.id)}
          aria-pressed={selectedId === item.id}
          className={cn(
            "block w-full py-1.5 text-left text-sm transition-colors",
            selectedId === item.id
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.name}
        </button>
      ))}
    </nav>
  );
}

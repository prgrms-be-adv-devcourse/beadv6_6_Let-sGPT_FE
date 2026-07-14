import { cn } from "@/shared/lib/utils";

const PAGE_GROUP_SIZE = 5;

function getVisiblePages(page: number, totalPages: number): number[] {
  const groupStart = Math.floor(page / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE;
  const groupSize = Math.min(PAGE_GROUP_SIZE, totalPages - groupStart);
  return Array.from({ length: groupSize }, (_, index) => groupStart + index);
}

/** 에디토리얼 미니멀 페이지네이션(0-인덱스 page). 페이지가 1개 이하면 렌더하지 않는다. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(page, totalPages);

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-0.5 sm:gap-1"
      aria-label="페이지네이션"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="h-9 shrink-0 px-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 sm:px-3"
      >
        이전
      </button>
      {pages.map((index) => (
        <button
          key={index}
          type="button"
          onClick={() => onPageChange(index)}
          aria-current={index === page ? "page" : undefined}
          className={cn(
            "size-9 shrink-0 rounded-md text-sm tabular-nums transition-colors",
            index === page
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {index + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages - 1}
        className="h-9 shrink-0 px-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 sm:px-3"
      >
        다음
      </button>
    </nav>
  );
}

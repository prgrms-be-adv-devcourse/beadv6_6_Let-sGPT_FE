import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { CategorySidebar } from "@/features/category/ui/CategorySidebar";
import type { FetchDropsParams } from "@/features/drop/api/drops.api";
import { useDropList } from "@/features/drop/api/drops.queries";
import type { DropStatus } from "@/features/drop/model/drop.schema";
import { DropCard } from "@/features/drop/ui/DropCard";
import { CatalogLayout } from "@/shared/ui/CatalogLayout";
import { FilterChip } from "@/shared/ui/FilterChip";
import { Pagination } from "@/shared/ui/Pagination";

export const Route = createFileRoute("/drops/")({
  component: DropListPage,
});

const PAGE_SIZE = 8;

const STATUS_FILTERS: { value: DropStatus | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  { value: "OPEN", label: "진행중" },
  { value: "REGISTERED", label: "오픈 예정" },
  { value: "CLOSE", label: "마감" },
  { value: "SOLD_OUT", label: "매진" },
];

const SORT_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "추천순" },
  { value: "openAt,asc", label: "오픈 빠른순" },
  { value: "dropPrice,asc", label: "가격 낮은순" },
  { value: "dropPrice,desc", label: "가격 높은순" },
];

function DropListPage() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<DropStatus | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);

  const update = (action: () => void) => {
    action();
    setPage(0);
  };

  const params: FetchDropsParams = {
    page,
    size: PAGE_SIZE,
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status } : {}),
    ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
    ...(sort ? { sort } : {}),
  };
  const drops = useDropList(params);

  const statusBar = (
    <div className="flex flex-wrap gap-2">
      {STATUS_FILTERS.map((item) => (
        <FilterChip
          key={item.label}
          active={status === item.value}
          onClick={() => update(() => setStatus(item.value))}
        >
          {item.label}
        </FilterChip>
      ))}
    </div>
  );

  const filterDrawer = (
    <div className="space-y-2">
      <p className="font-medium text-sm">정렬</p>
      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((option) => (
          <FilterChip
            key={option.label}
            active={sort === option.value}
            onClick={() => update(() => setSort(option.value))}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );

  return (
    <CatalogLayout
      eyebrow="Drops"
      title="한정판 드롭"
      sidebar={
        <CategorySidebar
          selectedId={categoryId}
          onSelect={(id) => update(() => setCategoryId(id))}
        />
      }
      statusBar={statusBar}
      filterDrawer={filterDrawer}
      searchValue={keyword}
      onSearchChange={(value) => update(() => setKeyword(value))}
      searchPlaceholder="드롭명 검색"
      resultCount={drops.data?.totalElements}
    >
      {drops.isPending ? (
        <p className="py-10 text-muted-foreground text-sm">드롭을 불러오는 중…</p>
      ) : null}
      {drops.isError ? (
        <p className="py-10 text-destructive text-sm">드롭을 불러오지 못했습니다.</p>
      ) : null}
      {drops.data && drops.data.content.length === 0 ? (
        <p className="py-10 text-muted-foreground text-sm">해당하는 드롭이 없습니다.</p>
      ) : null}
      {drops.data && drops.data.content.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
            {drops.data.content.map((drop) => (
              <DropCard key={drop.id} drop={drop} />
            ))}
          </div>
          <Pagination page={page} totalPages={drops.data.totalPages} onPageChange={setPage} />
        </>
      ) : null}
    </CatalogLayout>
  );
}

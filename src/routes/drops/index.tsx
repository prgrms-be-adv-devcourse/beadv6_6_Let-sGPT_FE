import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useDropList } from "@/features/drop/api/drops.queries";
import type { DropStatus } from "@/features/drop/model/drop.schema";
import { DropCard } from "@/features/drop/ui/DropCard";
import { FilterChip } from "@/shared/ui/FilterChip";

export const Route = createFileRoute("/drops/")({
  component: DropListPage,
});

type DropTab = "ALL" | "OPEN" | "REGISTERED" | "CLOSED";

const TABS: { key: DropTab; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "OPEN", label: "진행중" },
  { key: "REGISTERED", label: "오픈 예정" },
  { key: "CLOSED", label: "마감" },
];

function matchesTab(status: DropStatus, tab: DropTab): boolean {
  if (tab === "ALL") {
    return true;
  }
  if (tab === "CLOSED") {
    return status === "CLOSE" || status === "SOLD_OUT";
  }
  return status === tab;
}

function DropListPage() {
  const [tab, setTab] = useState<DropTab>("ALL");
  const drops = useDropList();
  const items = (drops.data?.content ?? []).filter((drop) => matchesTab(drop.status, tab));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Drops</p>
        <h1 className="font-serif text-4xl tracking-tight">한정판 드롭</h1>
      </header>

      <div className="flex flex-wrap gap-2 border-border border-b pb-5">
        {TABS.map((item) => (
          <FilterChip key={item.key} active={tab === item.key} onClick={() => setTab(item.key)}>
            {item.label}
          </FilterChip>
        ))}
      </div>

      {drops.isPending ? (
        <p className="py-10 text-muted-foreground text-sm">드롭을 불러오는 중…</p>
      ) : null}
      {drops.isError ? (
        <p className="py-10 text-destructive text-sm">드롭을 불러오지 못했습니다.</p>
      ) : null}
      {drops.data && items.length === 0 ? (
        <p className="py-10 text-muted-foreground text-sm">해당하는 드롭이 없습니다.</p>
      ) : null}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {items.map((drop) => (
            <DropCard key={drop.id} drop={drop} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

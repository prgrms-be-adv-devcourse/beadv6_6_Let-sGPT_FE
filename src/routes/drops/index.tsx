import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useCategories } from "@/features/category/api/categories.queries";
import { useDropList } from "@/features/drop/api/drops.queries";
import type { DropCard, DropStatus } from "@/features/drop/model/drop.schema";
import { Countdown } from "@/features/drop/ui/Countdown";
import { DropStatusPill } from "@/features/drop/ui/DropStatusPill";
import { BrandLink } from "@/features/product/ui/BrandLink";
import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { LoadingState } from "@/shared/ui/LoadingState";
import { MenuSelect } from "@/shared/ui/MenuSelect";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Tag } from "@/shared/ui/Tag";

export const Route = createFileRoute("/drops/")({
  component: DropListPage,
});

const STATUS_FILTERS: { value: DropStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "OPEN", label: "진행중" },
  { value: "REGISTERED", label: "오픈 예정" },
  { value: "CLOSE", label: "마감" },
  { value: "SOLD_OUT", label: "매진" },
];

const SORTS = [
  { value: "recommended", label: "추천순" },
  { value: "open-asc", label: "오픈 빠른순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

function sortDrops(list: DropCard[], sort: SortValue): DropCard[] {
  const copy = [...list];
  if (sort === "open-asc") return copy.sort((a, b) => a.openAt.localeCompare(b.openAt));
  if (sort === "price-asc") return copy.sort((a, b) => a.dropPrice - b.dropPrice);
  if (sort === "price-desc") return copy.sort((a, b) => b.dropPrice - a.dropPrice);
  return copy;
}

function DropListPage() {
  const drops = useDropList({ size: 50 });
  const categories = useCategories();
  const [status, setStatus] = useState<DropStatus | "ALL">("OPEN");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<SortValue>("recommended");

  const filtered = useMemo(() => {
    const base = (drops.data?.content ?? []).filter((drop) => {
      if (status !== "ALL" && drop.status !== status) return false;
      if (categoryId && drop.categoryId !== categoryId) return false;
      return true;
    });
    return sortDrops(base, sort);
  }, [drops.data, status, categoryId, sort]);

  const featured =
    filtered.find((d) => d.status === "OPEN") ?? filtered.find((d) => d.status === "REGISTERED");
  const rows = filtered.filter((d) => d.id !== featured?.id);

  const categoryOptions = [
    { value: "", label: "전체" },
    ...(categories.data ?? []).map((category) => ({ value: category.id, label: category.name })),
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.3em]">Release Board</p>
          <h1 className="font-serif text-5xl tracking-tight">드롭 캘린더</h1>
        </div>
        <p className="text-muted-foreground text-sm tabular-nums">
          {drops.isPending ? "불러오는 중…" : `${filtered.length}개의 드롭`}
        </p>
      </header>

      {featured ? <FeaturedDrop drop={featured} /> : null}

      <div className="sticky top-16 z-30 -mx-6 flex flex-col gap-4 border-border border-b bg-background/85 px-6 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <SegmentedControl
          aria-label="카테고리 필터"
          variant="underline"
          className="lg:flex-1"
          options={categoryOptions}
          value={categoryId ?? ""}
          onChange={(value) => setCategoryId(value || undefined)}
        />
        <div className="flex shrink-0 items-center gap-5">
          <MenuSelect
            aria-label="상태 필터"
            options={STATUS_FILTERS}
            value={status}
            onChange={(value) => setStatus(value as DropStatus | "ALL")}
          />
          <MenuSelect
            aria-label="정렬"
            options={SORTS}
            value={sort}
            onChange={(value) => setSort(value as SortValue)}
          />
        </div>
      </div>

      {drops.isPending ? (
        <LoadingState label="드롭을 불러오는 중" />
      ) : drops.isError ? (
        <p className="py-16 text-center text-destructive text-sm">드롭을 불러오지 못했습니다.</p>
      ) : rows.length === 0 && !featured ? (
        <p className="py-16 text-center text-muted-foreground text-sm">해당하는 드롭이 없습니다.</p>
      ) : (
        <ol className="-mt-2">
          {rows.map((drop, index) => (
            <ReleaseRow key={drop.id} drop={drop} index={index + 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

function FeaturedDrop({ drop }: { drop: DropCard }) {
  const isLive = drop.status === "OPEN";
  const soldPercent = Math.round(
    (1 - Math.min(Math.max(drop.remainingQuantity / Math.max(drop.totalQuantity, 1), 0), 1)) * 100,
  );

  return (
    <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <Link
        to="/drops/$id"
        params={{ id: drop.id }}
        className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-surface lg:aspect-[5/4]"
      >
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
          <ImagePlaceholder name={drop.productName} src={drop.thumbnailKey} />
        </div>
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 font-medium text-xs backdrop-blur">
          {isLive ? (
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-live" />
            </span>
          ) : null}
          {isLive ? "NOW LIVE" : "다음 드롭"}
        </span>
      </Link>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {drop.categoryName ? <Tag>{drop.categoryName}</Tag> : null}
            {drop.sellerName ? (
              <BrandLink sellerName={drop.sellerName} className="text-muted-foreground text-sm" />
            ) : null}
          </div>
          <h2 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            {drop.productName}
          </h2>
          <p className="font-medium text-xl tabular-nums">{formatKrw(drop.dropPrice)}</p>
        </div>

        {isLive ? (
          <div className="space-y-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full bg-foreground", soldPercent >= 85 && "bg-live")}
                style={{ width: `${soldPercent}%` }}
              />
            </div>
            <p className="text-muted-foreground text-sm tabular-nums">
              {soldPercent}% 판매 · 남은 {drop.remainingQuantity}점
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Countdown target={drop.openAt} />
            <p className="text-muted-foreground text-sm">{formatDateTime(drop.openAt)} 오픈</p>
          </div>
        )}

        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link to="/drops/$id" params={{ id: drop.id }}>
            {isLive ? "지금 구매하기" : "드롭 자세히 보기"}
          </Link>
        </Button>
      </div>
    </section>
  );
}

function ReleaseRow({ drop, index }: { drop: DropCard; index: number }) {
  const pad = index.toString().padStart(2, "0");
  return (
    <li>
      <Link
        to="/drops/$id"
        params={{ id: drop.id }}
        className="group grid grid-cols-[2rem_4rem_1fr_auto] items-center gap-4 border-border border-b py-5 transition-colors hover:bg-surface sm:grid-cols-[2.5rem_4.5rem_1fr_10rem_8rem] sm:gap-6"
      >
        <span className="font-serif text-lg text-muted-foreground tabular-nums">{pad}</span>
        <div className="size-16 overflow-hidden rounded-md bg-surface">
          <ImagePlaceholder name={drop.productName} src={drop.thumbnailKey} />
        </div>
        <div className="min-w-0 space-y-1.5">
          <h3 className="truncate font-medium text-base">{drop.productName}</h3>
          <div className="flex items-center gap-2">
            <Tag>{drop.categoryName ?? "기타"}</Tag>
            {drop.sellerName ? (
              <BrandLink
                sellerName={drop.sellerName}
                className="max-w-full truncate text-muted-foreground text-xs"
              />
            ) : null}
          </div>
        </div>
        <div className="hidden text-right text-muted-foreground text-sm tabular-nums sm:block">
          {drop.status === "OPEN"
            ? `남은 ${drop.remainingQuantity}점`
            : drop.status === "REGISTERED"
              ? formatDateTime(drop.openAt)
              : null}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="font-medium tabular-nums">{formatKrw(drop.dropPrice)}</p>
          <DropStatusPill status={drop.status} />
        </div>
      </Link>
    </li>
  );
}

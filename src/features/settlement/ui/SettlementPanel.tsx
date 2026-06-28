import { type ReactNode, useState } from "react";

import { formatKrw } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { MenuSelect } from "@/shared/ui/MenuSelect";
import { MonthPicker } from "@/shared/ui/MonthPicker";
import { Pagination } from "@/shared/ui/Pagination";
import type { SettlementScope } from "../api/settlements.api";
import {
  useRetryFailedSettlements,
  useSellerSettlements,
  useSettlementOrders,
} from "../api/settlements.queries";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  READY: "대기",
  COMPLETED: "완료",
  FAILED: "실패",
};

const SELLER_STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "READY", label: "대기" },
  { value: "COMPLETED", label: "완료" },
  { value: "FAILED", label: "실패" },
];
const ORDER_STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "READY", label: "대기" },
  { value: "COMPLETED", label: "완료" },
];

const TABS = [
  { value: "sellers", label: "판매자 정산" },
  { value: "orders", label: "주문별 정산" },
] as const;

function formatMonth(yyyymm: string): string {
  return `${yyyymm.slice(0, 4)}.${yyyymm.slice(4)}`;
}

/** 정산 상태 펠릿 — 소프트 틴티드(완료=뉴트럴 / 대기=뮤트 / 실패=destructive). */
function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "FAILED"
      ? "bg-destructive/10 text-destructive"
      : status === "COMPLETED"
        ? "bg-foreground/[0.06] text-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-medium text-xs leading-none",
        tone,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/** KPI 요약 카드(현재 결과 합계) — 헤드라인 숫자는 카드, 상세는 테이블(2026 핀테크 패턴). */
function SummaryCards({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[0.7rem] text-muted-foreground uppercase tracking-[0.16em]">
            {item.label}
          </p>
          <p className="mt-2 font-numeric text-2xl tracking-tight tabular-nums">
            {formatKrw(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

const thClass = "px-4 py-3 text-left font-medium text-[0.7rem] uppercase tracking-[0.12em]";
const tdClass = "px-4 py-3.5";

type Tab = "sellers" | "orders";

/** 정산 조회 — 판매자/관리자 공용. 세그먼트 탭 + 모던 필터 + KPI 카드 + 클린 테이블. */
export function SettlementPanel({ scope }: { scope: SettlementScope }) {
  const [tab, setTab] = useState<Tab>("sellers");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  const filter = {
    ...(month ? { settlementMonth: month } : {}),
    ...(status ? { status } : {}),
    page,
    size: PAGE_SIZE,
  };
  const sellers = useSellerSettlements(scope, filter);
  const orders = useSettlementOrders(scope, filter);
  const retry = useRetryFailedSettlements();

  function resetPageAnd(setter: () => void) {
    setter();
    setPage(0);
  }

  const hasFailed =
    scope === "admin" &&
    tab === "sellers" &&
    (sellers.data?.content.some((item) => item.status === "FAILED") ?? false);

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="정산 구분"
        className="flex items-center gap-8 border-border border-b"
      >
        {TABS.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => resetPageAnd(() => setTab(item.value))}
              className={cn(
                "-mb-px border-b-2 pb-3 text-sm transition-colors",
                active
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-border border-b pb-4">
        <MonthPicker
          aria-label="정산 월"
          align="left"
          value={month}
          onChange={(value) => resetPageAnd(() => setMonth(value))}
        />
        <MenuSelect
          aria-label="상태"
          align="left"
          options={tab === "sellers" ? SELLER_STATUS_OPTIONS : ORDER_STATUS_OPTIONS}
          value={status}
          onChange={(value) => resetPageAnd(() => setStatus(value))}
        />
        {hasFailed ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={retry.isPending}
            onClick={() => retry.mutate(month)}
          >
            {retry.isPending ? "재시도 중…" : "실패 정산 재시도"}
          </Button>
        ) : null}
      </div>

      {tab === "sellers" ? <SellerView query={sellers} page={page} onPage={setPage} /> : null}
      {tab === "orders" ? <OrderView query={orders} page={page} onPage={setPage} /> : null}
    </div>
  );
}

function EmptyOrError({ query }: { query: { isPending: boolean; isError: boolean } }) {
  if (query.isPending) {
    return <p className="py-12 text-center text-muted-foreground text-sm">불러오는 중…</p>;
  }
  if (query.isError) {
    return (
      <p className="py-12 text-center text-destructive text-sm">정산을 불러오지 못했습니다.</p>
    );
  }
  return <p className="py-12 text-center text-muted-foreground text-sm">정산 내역이 없습니다.</p>;
}

function SellerView({
  query,
  page,
  onPage,
}: {
  query: ReturnType<typeof useSellerSettlements>;
  page: number;
  onPage: (page: number) => void;
}) {
  if (!query.data || query.data.content.length === 0) {
    return <EmptyOrError query={query} />;
  }
  const content = query.data.content;
  const sum = (pick: (item: (typeof content)[number]) => number) =>
    content.reduce((total, item) => total + pick(item), 0);

  return (
    <div className="space-y-6">
      <SummaryCards
        items={[
          { label: "결제액 합계", value: sum((item) => item.totalPaidAmount) },
          { label: "수수료 합계", value: sum((item) => item.totalFeeAmount) },
          { label: "최종 정산액", value: sum((item) => item.finalSettlementAmount) },
        ]}
      />
      <TableShell>
        <thead className="border-border border-b bg-surface/60 text-muted-foreground">
          <tr>
            <th className={thClass}>정산월</th>
            <th className={`${thClass} text-right`}>주문수</th>
            <th className={`${thClass} text-right`}>결제액</th>
            <th className={`${thClass} text-right`}>수수료</th>
            <th className={`${thClass} text-right`}>환불</th>
            <th className={`${thClass} text-right`}>최종 정산액</th>
            <th className={thClass}>상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {content.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-surface/40">
              <td className={`${tdClass} tabular-nums`}>{formatMonth(item.settlementMonth)}</td>
              <td className={`${tdClass} text-right tabular-nums`}>{item.totalOrderCount}</td>
              <td className={`${tdClass} text-right tabular-nums`}>
                {formatKrw(item.totalPaidAmount)}
              </td>
              <td className={`${tdClass} text-right text-muted-foreground tabular-nums`}>
                {formatKrw(item.totalFeeAmount)}
              </td>
              <td className={`${tdClass} text-right text-muted-foreground tabular-nums`}>
                {formatKrw(item.totalRefundAmount)}
              </td>
              <td className={`${tdClass} text-right font-medium tabular-nums`}>
                {formatKrw(item.finalSettlementAmount)}
              </td>
              <td className={tdClass}>
                <StatusBadge status={item.status} />
                {item.failReason ? (
                  <p className="mt-1 text-destructive text-xs">{item.failReason}</p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <Pagination page={page} totalPages={query.data.totalPages} onPageChange={onPage} />
    </div>
  );
}

function OrderView({
  query,
  page,
  onPage,
}: {
  query: ReturnType<typeof useSettlementOrders>;
  page: number;
  onPage: (page: number) => void;
}) {
  if (!query.data || query.data.content.length === 0) {
    return <EmptyOrError query={query} />;
  }
  const content = query.data.content;
  const sum = (pick: (item: (typeof content)[number]) => number) =>
    content.reduce((total, item) => total + pick(item), 0);

  return (
    <div className="space-y-6">
      <SummaryCards
        items={[
          { label: "결제액 합계", value: sum((item) => item.paidAmount) },
          { label: "수수료 합계", value: sum((item) => item.feeAmount) },
          { label: "순정산액 합계", value: sum((item) => item.netSettlementAmount) },
        ]}
      />
      <TableShell>
        <thead className="border-border border-b bg-surface/60 text-muted-foreground">
          <tr>
            <th className={thClass}>정산월</th>
            <th className={thClass}>주문</th>
            <th className={`${thClass} text-right`}>결제액</th>
            <th className={`${thClass} text-right`}>수수료</th>
            <th className={`${thClass} text-right`}>환불</th>
            <th className={`${thClass} text-right`}>순정산액</th>
            <th className={thClass}>상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {content.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-surface/40">
              <td className={`${tdClass} tabular-nums`}>{formatMonth(item.settlementMonth)}</td>
              <td className={`${tdClass} font-mono text-muted-foreground text-xs`}>
                {item.orderId}
              </td>
              <td className={`${tdClass} text-right tabular-nums`}>{formatKrw(item.paidAmount)}</td>
              <td className={`${tdClass} text-right text-muted-foreground tabular-nums`}>
                {formatKrw(item.feeAmount)}
              </td>
              <td className={`${tdClass} text-right text-muted-foreground tabular-nums`}>
                {formatKrw(item.refundAmount)}
              </td>
              <td className={`${tdClass} text-right font-medium tabular-nums`}>
                {formatKrw(item.netSettlementAmount)}
              </td>
              <td className={tdClass}>
                <StatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <Pagination page={page} totalPages={query.data.totalPages} onPageChange={onPage} />
    </div>
  );
}

import { useState } from "react";

import { formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { FilterChip } from "@/shared/ui/FilterChip";
import { Pagination } from "@/shared/ui/Pagination";
import type { SettlementScope } from "../api/settlements.api";
import {
  useRetryFailedSettlements,
  useSellerSettlements,
  useSettlementOrders,
} from "../api/settlements.queries";

const PAGE_SIZE = 10;
const MONTHS = [
  { value: "", label: "전체 월" },
  { value: "202606", label: "2026.06" },
  { value: "202605", label: "2026.05" },
  { value: "202604", label: "2026.04" },
];

const controlClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";

function formatMonth(yyyymm: string): string {
  return `${yyyymm.slice(0, 4)}.${yyyymm.slice(4)}`;
}

const STATUS_LABEL: Record<string, string> = {
  READY: "대기",
  COMPLETED: "완료",
  FAILED: "실패",
};

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "FAILED"
      ? "border-destructive/40 text-destructive"
      : status === "COMPLETED"
        ? "border-foreground/30 text-foreground"
        : "border-border text-muted-foreground";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${tone}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

type Tab = "sellers" | "orders";

/** 정산 조회 — 판매자/관리자 공용. 판매자·월 집계 + 주문 단위 탭, 월·상태 필터, 페이징. */
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

  const statusOptions =
    tab === "sellers" ? ["", "READY", "COMPLETED", "FAILED"] : ["", "READY", "COMPLETED"];

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
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={tab === "sellers"}
          onClick={() => resetPageAnd(() => setTab("sellers"))}
        >
          판매자 정산
        </FilterChip>
        <FilterChip active={tab === "orders"} onClick={() => resetPageAnd(() => setTab("orders"))}>
          주문별 정산
        </FilterChip>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-border border-y py-3">
        <select
          className={controlClass}
          value={month}
          onChange={(event) => resetPageAnd(() => setMonth(event.target.value))}
        >
          {MONTHS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className={controlClass}
          value={status}
          onChange={(event) => resetPageAnd(() => setStatus(event.target.value))}
        >
          {statusOptions.map((value) => (
            <option key={value || "all"} value={value}>
              {value ? STATUS_LABEL[value] : "전체 상태"}
            </option>
          ))}
        </select>
        {hasFailed ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={retry.isPending}
            onClick={() => retry.mutate(month || "202604")}
          >
            {retry.isPending ? "재시도 중…" : "실패 정산 재시도"}
          </Button>
        ) : null}
      </div>

      {tab === "sellers" ? <SellerTable query={sellers} page={page} onPage={setPage} /> : null}
      {tab === "orders" ? <OrderTable query={orders} page={page} onPage={setPage} /> : null}
    </div>
  );
}

type QueryLike<T> = {
  isPending: boolean;
  isError: boolean;
  data?: { content: T[]; totalPages: number } | undefined;
};

function TableState({ query }: { query: QueryLike<unknown> }) {
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

function SellerTable({
  query,
  page,
  onPage,
}: {
  query: ReturnType<typeof useSellerSettlements>;
  page: number;
  onPage: (page: number) => void;
}) {
  if (!query.data || query.data.content.length === 0) {
    return <TableState query={query} />;
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-xs">
            <tr className="border-border border-b text-left">
              <th className="py-2 pr-4 font-medium">정산월</th>
              <th className="py-2 pr-4 text-right font-medium">주문수</th>
              <th className="py-2 pr-4 text-right font-medium">결제액</th>
              <th className="py-2 pr-4 text-right font-medium">수수료</th>
              <th className="py-2 pr-4 text-right font-medium">환불</th>
              <th className="py-2 pr-4 text-right font-medium">최종 정산액</th>
              <th className="py-2 font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {query.data.content.map((item) => (
              <tr key={item.id}>
                <td className="py-3 pr-4 tabular-nums">{formatMonth(item.settlementMonth)}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{item.totalOrderCount}</td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  {formatKrw(item.totalPaidAmount)}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                  {formatKrw(item.totalFeeAmount)}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                  {formatKrw(item.totalRefundAmount)}
                </td>
                <td className="py-3 pr-4 text-right font-medium tabular-nums">
                  {formatKrw(item.finalSettlementAmount)}
                </td>
                <td className="py-3">
                  <StatusBadge status={item.status} />
                  {item.failReason ? (
                    <p className="mt-1 text-destructive text-xs">{item.failReason}</p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={query.data.totalPages} onPageChange={onPage} />
    </div>
  );
}

function OrderTable({
  query,
  page,
  onPage,
}: {
  query: ReturnType<typeof useSettlementOrders>;
  page: number;
  onPage: (page: number) => void;
}) {
  if (!query.data || query.data.content.length === 0) {
    return <TableState query={query} />;
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-xs">
            <tr className="border-border border-b text-left">
              <th className="py-2 pr-4 font-medium">정산월</th>
              <th className="py-2 pr-4 font-medium">주문</th>
              <th className="py-2 pr-4 text-right font-medium">결제액</th>
              <th className="py-2 pr-4 text-right font-medium">수수료</th>
              <th className="py-2 pr-4 text-right font-medium">환불</th>
              <th className="py-2 pr-4 text-right font-medium">순정산액</th>
              <th className="py-2 font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {query.data.content.map((item) => (
              <tr key={item.id}>
                <td className="py-3 pr-4 tabular-nums">{formatMonth(item.settlementMonth)}</td>
                <td className="py-3 pr-4 font-mono text-muted-foreground text-xs">
                  {item.orderId}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">{formatKrw(item.paidAmount)}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                  {formatKrw(item.feeAmount)}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                  {formatKrw(item.refundAmount)}
                </td>
                <td className="py-3 pr-4 text-right font-medium tabular-nums">
                  {formatKrw(item.netSettlementAmount)}
                </td>
                <td className="py-3">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={query.data.totalPages} onPageChange={onPage} />
    </div>
  );
}

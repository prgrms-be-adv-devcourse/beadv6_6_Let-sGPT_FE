import { type ReactNode, useState } from "react";

import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { MenuSelect } from "@/shared/ui/MenuSelect";
import { MonthPicker } from "@/shared/ui/MonthPicker";
import { Pagination } from "@/shared/ui/Pagination";
import {
  useRetryFailedSettlements,
  useSellerSettlements,
  useSettlementBatchResults,
  useSettlementOrders,
} from "../api/settlements.queries";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  READY: "대기",
  RUNNING: "진행 중",
  COMPLETED: "완료",
  FAILED: "실패",
};

const BATCH_TYPE_LABEL: Record<string, string> = {
  LOAD_PAYMENT: "결제 내역 적재",
  LOAD_REFUND: "환불 내역 적재",
  SETTLEMENT_RUN: "정산 실행",
  SETTLEMENT_RETRY: "재정산",
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
const BATCH_STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "READY", label: "대기" },
  { value: "RUNNING", label: "진행 중" },
  { value: "COMPLETED", label: "완료" },
  { value: "FAILED", label: "실패" },
];

const TABS = [
  { value: "sellers", label: "판매자 정산" },
  { value: "orders", label: "주문별 정산" },
  { value: "batches", label: "배치 결과" },
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
function SummaryCards({
  items,
}: {
  items: { label: string; value: number; format?: "currency" | "count" }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[0.7rem] text-muted-foreground uppercase tracking-[0.16em]">
            {item.label}
          </p>
          <p className="mt-2 font-numeric text-2xl tracking-tight tabular-nums">
            {item.format === "count" ? item.value.toLocaleString("ko-KR") : formatKrw(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function TableShell({
  children,
  tableClassName,
}: {
  children: ReactNode;
  tableClassName?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className={cn("w-full text-sm", tableClassName)}>{children}</table>
    </div>
  );
}

const thClass = "px-4 py-3 text-left font-medium text-[0.7rem] uppercase tracking-[0.12em]";
const tdClass = "px-4 py-3.5";

type Tab = "sellers" | "orders" | "batches";

type SettlementPanelProps =
  | { scope: "seller"; sellerId: string }
  | { scope: "admin"; sellerId?: never };

/** 정산 조회 — 판매자/관리자 공용. 세그먼트 탭 + 모던 필터 + KPI 카드 + 클린 테이블. */
export function SettlementPanel({ scope, sellerId }: SettlementPanelProps) {
  const [tab, setTab] = useState<Tab>("sellers");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [sellerIdInput, setSellerIdInput] = useState("");
  const [adminSellerId, setAdminSellerId] = useState("");
  const [sellerOrderIdInput, setSellerOrderIdInput] = useState("");
  const [sellerOrderId, setSellerOrderId] = useState("");
  const [orderSellerIdInput, setOrderSellerIdInput] = useState("");
  const [orderIdInput, setOrderIdInput] = useState("");
  const [adminOrderSellerId, setAdminOrderSellerId] = useState("");
  const [adminOrderId, setAdminOrderId] = useState("");
  const [page, setPage] = useState(0);

  const filter = {
    ...(month ? { settlementMonth: month } : {}),
    ...(status ? { status } : {}),
    page,
    size: PAGE_SIZE,
  };
  const settlementSellerId = scope === "seller" ? sellerId : adminSellerId || undefined;
  const orderSellerId = scope === "seller" ? sellerId : adminOrderSellerId || undefined;
  const orderId = scope === "seller" ? sellerOrderId : adminOrderId;
  const sellers = useSellerSettlements(scope, settlementSellerId, filter, tab === "sellers");
  const orders = useSettlementOrders(
    scope,
    {
      ...filter,
      ...(orderSellerId ? { sellerId: orderSellerId } : {}),
      ...(orderId ? { orderId } : {}),
    },
    tab === "orders",
  );
  const batchResults = useSettlementBatchResults(filter, scope === "admin" && tab === "batches");
  const retry = useRetryFailedSettlements();
  const tabs = scope === "admin" ? TABS : TABS.slice(0, 2);
  const statusOptions =
    tab === "sellers"
      ? SELLER_STATUS_OPTIONS
      : tab === "orders"
        ? ORDER_STATUS_OPTIONS
        : BATCH_STATUS_OPTIONS;

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
        {tabs.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                resetPageAnd(() => {
                  setTab(item.value);
                  setStatus("");
                })
              }
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
          options={statusOptions}
          value={status}
          onChange={(value) => resetPageAnd(() => setStatus(value))}
        />
        {scope === "seller" && tab === "orders" ? (
          <form
            className="flex w-full items-center gap-2 sm:w-auto"
            onSubmit={(event) => {
              event.preventDefault();
              resetPageAnd(() => setSellerOrderId(sellerOrderIdInput.trim()));
            }}
          >
            <Input
              type="search"
              aria-label="주문 ID 검색"
              autoComplete="off"
              className="h-9 w-full font-mono text-xs sm:w-72"
              placeholder="orderId 입력"
              value={sellerOrderIdInput}
              onChange={(event) => setSellerOrderIdInput(event.target.value)}
            />
            <Button type="submit" variant="outline">
              검색
            </Button>
          </form>
        ) : null}
        {scope === "admin" && tab === "sellers" ? (
          <form
            className="flex w-full items-center gap-2 sm:w-auto"
            onSubmit={(event) => {
              event.preventDefault();
              resetPageAnd(() => setAdminSellerId(sellerIdInput.trim()));
            }}
          >
            <Input
              type="search"
              aria-label="판매자 ID 검색"
              autoComplete="off"
              className="h-9 w-full font-mono text-xs sm:w-72"
              placeholder="sellerId 입력"
              value={sellerIdInput}
              onChange={(event) => setSellerIdInput(event.target.value)}
            />
            <Button type="submit" variant="outline">
              검색
            </Button>
          </form>
        ) : null}
        {scope === "admin" && tab === "orders" ? (
          <form
            className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:w-auto xl:grid-cols-[18rem_18rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              resetPageAnd(() => {
                setAdminOrderSellerId(orderSellerIdInput.trim());
                setAdminOrderId(orderIdInput.trim());
              });
            }}
          >
            <Input
              type="search"
              aria-label="주문별 정산 판매자 ID 검색"
              autoComplete="off"
              className="h-9 font-mono text-xs"
              placeholder="sellerId 입력"
              value={orderSellerIdInput}
              onChange={(event) => setOrderSellerIdInput(event.target.value)}
            />
            <Input
              type="search"
              aria-label="주문 ID 검색"
              autoComplete="off"
              className="h-9 font-mono text-xs"
              placeholder="orderId 입력"
              value={orderIdInput}
              onChange={(event) => setOrderIdInput(event.target.value)}
            />
            <Button type="submit" variant="outline">
              검색
            </Button>
          </form>
        ) : null}
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

      {tab === "sellers" ? (
        <SellerView query={sellers} showSellerId={scope === "admin"} page={page} onPage={setPage} />
      ) : null}
      {tab === "orders" ? (
        <OrderView query={orders} showSellerId={scope === "admin"} page={page} onPage={setPage} />
      ) : null}
      {scope === "admin" && tab === "batches" ? (
        <BatchResultView query={batchResults} retry={retry} page={page} onPage={setPage} />
      ) : null}
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
  showSellerId,
  page,
  onPage,
}: {
  query: ReturnType<typeof useSellerSettlements>;
  showSellerId: boolean;
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
            {showSellerId ? <th className={thClass}>판매자 ID</th> : null}
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
              {showSellerId ? (
                <td
                  className={`${tdClass} whitespace-nowrap font-mono text-muted-foreground text-xs`}
                >
                  {item.sellerId}
                </td>
              ) : null}
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
  showSellerId,
  page,
  onPage,
}: {
  query: ReturnType<typeof useSettlementOrders>;
  showSellerId: boolean;
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
            {showSellerId ? <th className={thClass}>판매자 ID</th> : null}
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
              {showSellerId ? (
                <td
                  className={`${tdClass} whitespace-nowrap font-mono text-muted-foreground text-xs`}
                >
                  {item.sellerId}
                </td>
              ) : null}
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

function BatchResultView({
  query,
  retry,
  page,
  onPage,
}: {
  query: ReturnType<typeof useSettlementBatchResults>;
  retry: ReturnType<typeof useRetryFailedSettlements>;
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
      {retry.isSuccess ? (
        <p role="status" className="text-muted-foreground text-sm">
          {formatMonth(retry.data.settlementMonth)} 재정산 배치를 시작했습니다. (
          <span className="tabular-nums">{retry.data.retriedSellerCount}</span>개 판매자)
        </p>
      ) : null}
      {retry.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {retry.error.message}
        </p>
      ) : null}
      <SummaryCards
        items={[
          {
            label: "정산액 합계",
            value: sum((item) => item.totalSettlementAmount),
          },
          {
            label: "처리 주문",
            value: sum((item) => item.totalOrderCount),
            format: "count",
          },
          {
            label: "처리 판매자",
            value: sum((item) => item.totalSellerCount),
            format: "count",
          },
        ]}
      />
      <TableShell tableClassName="min-w-[1640px]">
        <thead className="border-border border-b bg-surface/60 text-muted-foreground">
          <tr>
            <th className={thClass}>배치 ID</th>
            <th className={thClass}>정산월</th>
            <th className={thClass}>배치 유형</th>
            <th className={thClass}>상태</th>
            <th className={thClass}>시작일시</th>
            <th className={thClass}>종료일시</th>
            <th className={`${thClass} text-right`}>주문수</th>
            <th className={`${thClass} text-right`}>판매자수</th>
            <th className={`${thClass} text-right`}>정산액</th>
            <th className={thClass}>실패 사유</th>
            <th className={thClass}>생성일시</th>
            <th className={`${thClass} text-right`}>작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {content.map((item) => {
            const retrying = retry.isPending && retry.variables === item.settlementMonth;
            return (
              <tr key={item.batchId} className="transition-colors hover:bg-surface/40">
                <td
                  className={`${tdClass} max-w-48 truncate font-mono text-muted-foreground text-xs`}
                  title={item.batchId}
                >
                  {item.batchId}
                </td>
                <td className={`${tdClass} whitespace-nowrap tabular-nums`}>
                  {formatMonth(item.settlementMonth)}
                </td>
                <td className={`${tdClass} whitespace-nowrap`}>
                  {BATCH_TYPE_LABEL[item.batchType] ?? item.batchType}
                </td>
                <td className={`${tdClass} whitespace-nowrap`}>
                  <StatusBadge status={item.status} />
                </td>
                <td className={`${tdClass} whitespace-nowrap text-muted-foreground tabular-nums`}>
                  {item.startedAt ? formatDateTime(item.startedAt) : "—"}
                </td>
                <td className={`${tdClass} whitespace-nowrap text-muted-foreground tabular-nums`}>
                  {item.endedAt ? formatDateTime(item.endedAt) : "—"}
                </td>
                <td className={`${tdClass} text-right tabular-nums`}>{item.totalOrderCount}</td>
                <td className={`${tdClass} text-right tabular-nums`}>{item.totalSellerCount}</td>
                <td className={`${tdClass} text-right font-medium tabular-nums`}>
                  {formatKrw(item.totalSettlementAmount)}
                </td>
                <td className={`${tdClass} max-w-64 text-muted-foreground`}>
                  {item.failReason ?? "—"}
                </td>
                <td className={`${tdClass} whitespace-nowrap text-muted-foreground tabular-nums`}>
                  {formatDateTime(item.createdAt)}
                </td>
                <td className={`${tdClass} text-right`}>
                  {item.status === "FAILED" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={retry.isPending}
                      onClick={() => retry.mutate(item.settlementMonth)}
                    >
                      {retrying ? "재정산 중…" : "재정산"}
                    </Button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>
      <Pagination page={page} totalPages={query.data.totalPages} onPageChange={onPage} />
    </div>
  );
}

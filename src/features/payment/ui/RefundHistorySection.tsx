import { useState } from "react";

import { formatKrw } from "@/shared/lib/format";
import { Pagination } from "@/shared/ui/Pagination";
import { useRefundHistories } from "../api/payments.queries";
import type { RefundResponse } from "../model/payment.schema";

const PAGE_SIZE = 8;

const REFUND_STATUS_LABEL: Record<RefundResponse["status"], string> = {
  PENDING: "처리 중",
  COMPLETE: "완료",
  FAILED: "실패",
};

/** 환불 이력 — GET /refunds/histories(content + totalPages). */
export function RefundHistorySection() {
  const [page, setPage] = useState(0);
  const histories = useRefundHistories({ page, size: PAGE_SIZE });

  if (histories.isPending) {
    return <p className="py-12 text-center text-muted-foreground text-sm">불러오는 중…</p>;
  }
  if (histories.isError) {
    return (
      <p className="py-12 text-center text-destructive text-sm">환불 이력을 불러오지 못했습니다.</p>
    );
  }
  if (histories.data.content.length === 0) {
    return <p className="py-12 text-center text-muted-foreground text-sm">환불 이력이 없습니다.</p>;
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-border border-border border-y">
        {histories.data.content.map((refund) => (
          <li key={refund.refundId} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0 space-y-1">
              <p className="font-medium">{REFUND_STATUS_LABEL[refund.status]}</p>
              <p className="truncate text-muted-foreground text-xs tabular-nums">
                결제 {refund.paymentId}
              </p>
            </div>
            <span className="shrink-0 font-medium tabular-nums">{formatKrw(refund.amount)}</span>
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={histories.data.totalPages} onPageChange={setPage} />
    </div>
  );
}

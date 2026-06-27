import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { DropCard as DropCardModel } from "../model/drop.schema";
import { DropStatusBadge } from "./DropStatusBadge";

const quantityFormatter = new Intl.NumberFormat("ko-KR");

/** 드롭 1건을 표현하는 순수 프레젠테이션 카드(데이터 페칭 없음). */
export function DropCard({ drop }: { drop: DropCardModel }) {
  return (
    <Card data-testid="drop-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{drop.productName}</CardTitle>
          <DropStatusBadge status={drop.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="font-semibold">{formatKrw(drop.dropPrice)}</p>
        <p className="text-muted-foreground text-sm">오픈 {formatDateTime(drop.openAt)}</p>
        <p className="text-muted-foreground text-sm">
          남은 수량 {quantityFormatter.format(drop.remainingQuantity)} /{" "}
          {quantityFormatter.format(drop.totalQuantity)}
        </p>
      </CardContent>
    </Card>
  );
}

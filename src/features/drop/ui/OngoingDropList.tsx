import type { ReactNode } from "react";

import { useOngoingDrops } from "../api/drops.queries";
import { DropCard } from "./DropCard";

function Message({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

/** 진행중(OPEN) 드롭 카드 그리드. BE 미가동/오류 시에도 화면이 깨지지 않도록 상태를 모두 처리. */
export function OngoingDropList() {
  const { data, isPending, isError } = useOngoingDrops();

  if (isPending) {
    return <Message>진행중인 드롭을 불러오는 중…</Message>;
  }
  if (isError) {
    return <Message>드롭 정보를 불러오지 못했습니다.</Message>;
  }
  if (data.content.length === 0) {
    return <Message>진행중인 드롭이 없습니다.</Message>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.content.map((drop) => (
        <DropCard key={drop.id} drop={drop} />
      ))}
    </div>
  );
}

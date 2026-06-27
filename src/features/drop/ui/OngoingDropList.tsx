import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useOngoingDrops } from "../api/drops.queries";
import { DropCard } from "./DropCard";

function Message({ children }: { children: ReactNode }) {
  return <p className="py-10 text-muted-foreground text-sm">{children}</p>;
}

/** 진행중(OPEN) 드롭 섹션 — 에디토리얼 섹션 헤더 + 카드 그리드. 로딩/에러/빈 상태를 모두 처리. */
export function OngoingDropList() {
  const { data, isPending, isError } = useOngoingDrops();
  const count = data?.content.length ?? 0;

  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between gap-4 border-border border-b pb-5">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
            Now Live · 진행중
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
            진행중인 드롭
            {count > 0 ? (
              <span className="ml-2 align-top text-base text-muted-foreground tabular-nums">
                {count}
              </span>
            ) : null}
          </h2>
        </div>
        <Link
          to="/drops"
          className="shrink-0 text-muted-foreground text-sm underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          전체보기
        </Link>
      </div>

      {isPending ? <Message>진행중인 드롭을 불러오는 중…</Message> : null}
      {isError ? <Message>드롭 정보를 불러오지 못했습니다.</Message> : null}
      {data && count === 0 ? <Message>진행중인 드롭이 없습니다.</Message> : null}
      {data && count > 0 ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {data.content.map((drop) => (
            <Link key={drop.id} to="/drops/$id" params={{ id: drop.id }} className="block">
              <DropCard drop={drop} />
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

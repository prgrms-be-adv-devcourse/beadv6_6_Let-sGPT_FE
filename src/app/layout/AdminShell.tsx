import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const itemClass =
  "rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-surface [&.active]:font-medium [&.active]:text-foreground";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * 관리자 콘솔 공통 셸 — 좌측 관리 메뉴(카테고리/정산) + 우측 콘텐츠.
 * 실제 BE 는 게이트웨이에서 ROLE_ADMIN 으로 게이트한다(여기선 로그인만 확인).
 */
export function AdminShell({ title, description, children }: Props) {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Admin</p>
        <h1 className="font-serif text-4xl tracking-tight">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </header>

      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          <Link to="/admin" className={itemClass} activeOptions={{ exact: true }}>
            대시보드
          </Link>
          <Link to="/admin/categories" className={itemClass}>
            카테고리 관리
          </Link>
          <Link to="/admin/settlements" className={itemClass}>
            정산 정보 관리
          </Link>
        </nav>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}

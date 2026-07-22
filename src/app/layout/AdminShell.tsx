import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const itemClass =
  "shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-surface [&.active]:font-medium [&.active]:text-foreground";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * 관리자 콘솔 공통 셸 — 좌측 관리 메뉴 + 우측 콘텐츠.
 * `/admin/*` 라우트와 게이트웨이가 모두 ROLE_ADMIN을 확인한다.
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
        <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:flex lg:flex-col">
          <Link to="/admin" className={itemClass} activeOptions={{ exact: true }}>
            대시보드
          </Link>
          <Link to="/admin/categories" className={itemClass}>
            카테고리 관리
          </Link>
          <Link to="/admin/settlements" className={itemClass}>
            정산 정보 관리
          </Link>
          <Link to="/admin/chatbot" className={itemClass}>
            AI 어시스턴트
          </Link>
        </nav>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}

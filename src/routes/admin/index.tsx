import { createFileRoute, Link } from "@tanstack/react-router";

import { AdminShell } from "@/app/layout/AdminShell";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

const CARDS = [
  {
    to: "/admin/categories" as const,
    title: "카테고리 관리",
    description: "상품 카테고리를 추가·수정·삭제합니다.",
  },
  {
    to: "/admin/settlements" as const,
    title: "정산 정보 관리",
    description: "판매자·주문 단위 정산 내역을 조회하고 실패를 재시도합니다.",
  },
];

function AdminDashboardPage() {
  return (
    <AdminShell title="관리자 대시보드" description="플랫폼 운영 메뉴">
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-lg border p-6 transition-colors hover:bg-surface"
          >
            <h2 className="font-medium text-lg">{card.title}</h2>
            <p className="mt-2 text-muted-foreground text-sm">{card.description}</p>
            <span className="mt-4 inline-block text-muted-foreground text-sm transition-colors group-hover:text-foreground">
              이동 →
            </span>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}

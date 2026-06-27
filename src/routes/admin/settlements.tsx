import { createFileRoute, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/app/layout/AdminShell";
import { useAuthStore } from "@/features/auth/store/authStore";
import { SettlementPanel } from "@/features/settlement/ui/SettlementPanel";

export const Route = createFileRoute("/admin/settlements")({
  beforeLoad: () => {
    if (!useAuthStore.getState().member) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminSettlementsPage,
});

function AdminSettlementsPage() {
  return (
    <AdminShell title="정산 정보 관리" description="전체 판매자·주문 정산 내역">
      <SettlementPanel scope="admin" />
    </AdminShell>
  );
}

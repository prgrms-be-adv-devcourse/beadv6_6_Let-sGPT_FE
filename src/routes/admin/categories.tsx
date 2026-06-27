import { createFileRoute, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/app/layout/AdminShell";
import { useAuthStore } from "@/features/auth/store/authStore";
import { CategoryManager } from "@/features/category/ui/CategoryManager";

export const Route = createFileRoute("/admin/categories")({
  beforeLoad: () => {
    if (!useAuthStore.getState().member) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  return (
    <AdminShell title="카테고리 관리" description="상품 분류 체계를 관리합니다.">
      <CategoryManager />
    </AdminShell>
  );
}

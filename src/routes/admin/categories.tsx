import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/app/layout/AdminShell";
import { CategoryManager } from "@/features/category/ui/CategoryManager";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  return (
    <AdminShell title="카테고리 관리" description="상품 분류 체계를 관리합니다.">
      <CategoryManager />
    </AdminShell>
  );
}

import { z } from "zod";

import { apiFetch } from "@/shared/api/http";
import { type Category, categoryListSchema } from "../model/category.schema";

// TODO(fe-api): GET /api/v1/categories -> Category[] (id·name). 상품/드롭 목록의 카테고리 필터에 필요.
//   BE CategoryController 는 POST/PATCH/DELETE(command)만 노출 → 조회(read) 미구현. [screens/02-product-list]
export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(new URL("/api/v1/categories", import.meta.env.VITE_API_BASE_URL));
  if (!response.ok) {
    throw new Error("카테고리를 불러오지 못했습니다.");
  }
  return categoryListSchema.parse(await response.json());
}

/** 카테고리 등록(POST /categories, ADMIN) — 201+Location, 본문 없음. */
export function createCategory(body: { name: string }): Promise<void> {
  return apiFetch("/api/v1/categories", z.void(), { method: "POST", body });
}

/** 카테고리명 수정(PATCH /categories/{id}, ADMIN) — 204. */
export function updateCategory(id: string, body: { name: string }): Promise<void> {
  return apiFetch(`/api/v1/categories/${id}`, z.void(), { method: "PATCH", body });
}

/** 카테고리 삭제(DELETE /categories/{id}, ADMIN) — 204(상품 category SET NULL). */
export function deleteCategory(id: string): Promise<void> {
  return apiFetch(`/api/v1/categories/${id}`, z.void(), { method: "DELETE" });
}

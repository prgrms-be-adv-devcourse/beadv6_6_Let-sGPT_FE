import { z } from "zod";

import { apiFetch } from "@/shared/api/http";
import { type Category, categoryListSchema } from "../model/category.schema";

// 카테고리 목록 조회(GET /api/v1/categories) — BE 구현됨(CategoryController.getCategories, 이름순). 공개 조회.
export function fetchCategories(): Promise<Category[]> {
  // 공개 조회(상품·드롭 카탈로그 필터) — apiFetch(auth:false)로 통일.
  return apiFetch("/api/v1/categories", categoryListSchema, { auth: false });
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

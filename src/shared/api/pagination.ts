import { z } from "zod";

/**
 * BE 공통 오프셋 페이징 응답(`com.openat.common.response.PageResponse`)에 대응하는 Zod 팩토리.
 * 도메인별 항목 스키마를 받아 페이지 스키마를 생성한다 → 페이징 응답 파싱을 한 곳에서 재사용.
 */
export function pageResponseSchema<T extends z.ZodType>(item: T) {
  return z.object({
    content: z.array(item),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
  });
}

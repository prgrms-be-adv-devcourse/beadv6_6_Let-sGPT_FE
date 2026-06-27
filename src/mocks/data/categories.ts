import type { Category } from "@/features/category/model/category.schema";

/** BE 시드 카테고리(의류/액세서리/문구/전자기기/피규어/기타)와 일치. */
export const categories: Category[] = [
  { id: "c-apparel", name: "의류" },
  { id: "c-acc", name: "액세서리" },
  { id: "c-stationery", name: "문구" },
  { id: "c-electronics", name: "전자기기" },
  { id: "c-figure", name: "피규어" },
  { id: "c-etc", name: "기타" },
];

import { HttpResponse, http } from "msw";

import type { Category } from "@/features/category/model/category.schema";

const categories: Category[] = [
  { id: "c-sneakers", name: "스니커즈" },
  { id: "c-apparel", name: "의류" },
  { id: "c-acc", name: "액세서리" },
  { id: "c-bag", name: "가방" },
];

export const categoryHandlers = [
  http.get("*/api/v1/categories", () => HttpResponse.json(categories)),
];

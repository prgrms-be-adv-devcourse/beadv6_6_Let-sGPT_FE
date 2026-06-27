import { HttpResponse, http } from "msw";

import type { DropCardPage } from "@/features/drop/model/drop.schema";
import { drops, findDrop } from "../data/drops";

export const dropHandlers = [
  http.get("*/api/v1/drops", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const categoryId = url.searchParams.get("categoryId");
    const keyword = url.searchParams.get("keyword");
    const page = Number(url.searchParams.get("page") ?? "0");
    const size = Number(url.searchParams.get("size") ?? "20");

    let filtered = drops;
    if (status) {
      filtered = filtered.filter((drop) => drop.status === status);
    }
    if (categoryId) {
      filtered = filtered.filter((drop) => drop.categoryId === categoryId);
    }
    if (keyword) {
      filtered = filtered.filter((drop) => drop.productName.includes(keyword));
    }

    const sortParam = url.searchParams.get("sort");
    if (sortParam) {
      const [field, dir] = sortParam.split(",");
      const sign = dir === "asc" ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        if (field === "dropPrice") {
          return (a.dropPrice - b.dropPrice) * sign;
        }
        if (a.openAt === b.openAt) return 0;
        return (a.openAt < b.openAt ? -1 : 1) * sign;
      });
    }

    const start = page * size;
    const body: DropCardPage = {
      content: filtered.slice(start, start + size),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    };
    return HttpResponse.json(body);
  }),

  // TODO(fe-api): 드롭 단건 조회는 BE 미구현 → provisional. DropApiSpec 에 GET /api/v1/drops/{id} 요청.
  http.get("*/api/v1/drops/:id", ({ params }) => {
    const drop = findDrop(String(params.id));
    if (!drop) {
      return HttpResponse.json(
        { error: "DROP_NOT_FOUND", message: "드롭을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return HttpResponse.json(drop);
  }),
];

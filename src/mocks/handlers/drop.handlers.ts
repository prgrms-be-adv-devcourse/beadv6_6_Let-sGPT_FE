import { HttpResponse, http } from "msw";

import type { DropCard, DropCardPage } from "@/features/drop/model/drop.schema";
import { drops, findDrop } from "../data/drops";
import { findProduct } from "../data/products";

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

  http.post("*/api/v1/drops", async ({ request }) => {
    const body = (await request.json()) as {
      productId: string;
      dropPrice: number;
      totalQuantity: number;
      limitPerUser?: number;
      openAt: string;
      closeAt?: string;
    };
    const product = findProduct(body.productId);
    if (!product) {
      return HttpResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    const id = crypto.randomUUID();
    // 오픈 시각이 지났으면 OPEN, 아니면 REGISTERED(예정)로 파생.
    const status: DropCard["status"] = new Date(body.openAt) <= new Date() ? "OPEN" : "REGISTERED";
    const created: DropCard = {
      id,
      productId: product.id,
      productName: product.name,
      sellerName: product.sellerName ?? null,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      thumbnailKey: product.thumbnailKey,
      dropPrice: body.dropPrice,
      totalQuantity: body.totalQuantity,
      remainingQuantity: body.totalQuantity,
      status,
      openAt: body.openAt,
      closeAt: body.closeAt ?? null,
    };
    drops.unshift(created);
    return new HttpResponse(null, { status: 201, headers: { Location: `/api/v1/drops/${id}` } });
  }),
];

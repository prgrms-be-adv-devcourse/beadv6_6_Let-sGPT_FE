import { HttpResponse, http } from "msw";
import type { DropCard, DropCardPage } from "@/features/drop/model/drop.schema";
import { uuid } from "@/shared/lib/id";
import { drops, findDrop } from "../data/drops";
import { findProduct, products, SELLER_ID } from "../data/products";

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

  // 판매자 본인 드롭 목록(GET /drops/me) — 활성 스토어 기준(목은 내 상품의 드롭). BE searchMyDrops.
  // `/drops/:id` 보다 먼저 등록해야 id="me" 로 잡히지 않는다.
  http.get("*/api/v1/drops/me", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "0");
    const size = Number(url.searchParams.get("size") ?? "20");
    const myProductIds = new Set(
      products.filter((product) => product.sellerId === SELLER_ID).map((product) => product.id),
    );
    const mine = drops.filter((drop) => myProductIds.has(drop.productId));
    const start = page * size;
    const body: DropCardPage = {
      content: mine.slice(start, start + size),
      page,
      size,
      totalElements: mine.length,
      totalPages: Math.max(1, Math.ceil(mine.length / size)),
    };
    return HttpResponse.json(body);
  }),

  // 드롭 단건 조회(GET /drops/{id}) — BE 구현됨(DropController.getDrop).
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
    const id = uuid();
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

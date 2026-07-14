import { HttpResponse, http } from "msw";

import type { Product, ProductPage } from "@/features/product/model/product.schema";
import { categories } from "../data/categories";
import { DEFAULT_SELLER_NAME, products, SELLER_ID } from "../data/products";

type ProductWriteBody = {
  name: string;
  description?: string;
  categoryId?: string;
  price?: number;
  thumbnailKey?: string;
  imageKeys?: string[];
};

type ProductSearchBody = {
  query: string | null;
  categoryName: string | null;
  startPrice: number | null;
  endPrice: number | null;
  page: number;
  size: number;
  sort: "createdAt,desc" | "price,asc" | "price,desc";
};

function paginate(list: Product[], page: number, size: number): ProductPage {
  const start = page * size;
  return {
    content: list.slice(start, start + size),
    page,
    size,
    totalElements: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / size)),
  };
}

export const productHandlers = [
  http.post("*/api/v1/searchs/search", async ({ request }) => {
    const body = (await request.json()) as ProductSearchBody;
    let filtered = products.filter((product) => {
      if (body.categoryName && product.categoryName !== body.categoryName) return false;
      if (body.startPrice !== null && (product.price === null || product.price < body.startPrice)) {
        return false;
      }
      if (body.endPrice !== null && (product.price === null || product.price > body.endPrice)) {
        return false;
      }
      if (body.query) {
        const searchable = `${product.name} ${product.description} ${product.categoryName ?? ""}`;
        if (!searchable.toLocaleLowerCase().includes(body.query.toLocaleLowerCase())) return false;
      }
      return true;
    });

    const [field, direction] = body.sort.split(",");
    const sign = direction === "asc" ? 1 : -1;
    filtered = [...filtered].sort((a, b) => {
      if (field === "price") {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return (a.price - b.price) * sign;
      }
      return a.createdAt.localeCompare(b.createdAt) * sign;
    });

    return HttpResponse.json(paginate(filtered, body.page, body.size));
  }),

  // 상품 이미지 업로드(BE: 로컬 파일 저장 → { key, url }). 목은 키만 발급.
  http.post("*/api/v1/products/images", () => {
    const key = `mock-${crypto.randomUUID()}.jpg`;
    return HttpResponse.json({ key, url: `/api/v1/products/images/${key}` });
  }),

  // 상품 이미지 조회 — 목은 키 기반 picsum 으로 리다이렉트해 실제 이미지를 보여준다.
  http.get("*/api/v1/products/images/:key", ({ params }) => {
    const seed = encodeURIComponent(String(params.key));
    return HttpResponse.redirect(`https://picsum.photos/seed/${seed}/640/800`, 302);
  }),

  http.get("*/api/v1/products/me", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "0");
    const size = Number(url.searchParams.get("size") ?? "20");
    const mine = products.filter((product) => product.sellerId === SELLER_ID);
    return HttpResponse.json(paginate(mine, page, size));
  }),

  http.get("*/api/v1/products", ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId");
    const keyword = url.searchParams.get("keyword");
    const page = Number(url.searchParams.get("page") ?? "0");
    const size = Number(url.searchParams.get("size") ?? "20");

    let filtered = products;
    if (categoryId) {
      filtered = filtered.filter((product) => product.categoryId === categoryId);
    }
    if (keyword) {
      filtered = filtered.filter((product) => product.name.includes(keyword));
    }

    const sortParam = url.searchParams.get("sort");
    if (sortParam) {
      const [field, dir] = sortParam.split(",");
      const sign = dir === "asc" ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        if (field === "price") {
          if (a.price === null && b.price === null) return 0;
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return (a.price - b.price) * sign;
        }
        if (a.createdAt === b.createdAt) return 0;
        return (a.createdAt < b.createdAt ? -1 : 1) * sign;
      });
    } else {
      filtered = [...filtered].sort((a, b) => {
        if (a.createdAt === b.createdAt) return 0;
        return a.createdAt < b.createdAt ? 1 : -1;
      });
    }

    return HttpResponse.json(paginate(filtered, page, size));
  }),

  http.get("*/api/v1/products/:id", ({ params }) => {
    const product = products.find((item) => item.id === params.id);
    if (!product) {
      return HttpResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return HttpResponse.json(product);
  }),

  http.post("*/api/v1/products", async ({ request }) => {
    const body = (await request.json()) as ProductWriteBody;
    const id = crypto.randomUUID();
    const category = categories.find((item) => item.id === body.categoryId);
    products.unshift({
      id,
      sellerId: SELLER_ID,
      sellerName: DEFAULT_SELLER_NAME,
      name: body.name,
      description: body.description ?? "",
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? null,
      price: body.price ?? null,
      thumbnailKey: body.thumbnailKey ?? null,
      imageKeys: body.imageKeys ?? [],
      createdAt: new Date().toISOString(),
    });
    return new HttpResponse(null, { status: 201, headers: { Location: `/api/v1/products/${id}` } });
  }),

  http.patch("*/api/v1/products/:id", async ({ params, request }) => {
    const body = (await request.json()) as ProductWriteBody;
    const product = products.find((item) => item.id === params.id);
    if (!product) {
      return HttpResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    const category = categories.find((item) => item.id === body.categoryId);
    product.name = body.name;
    product.description = body.description ?? "";
    product.categoryId = category?.id ?? null;
    product.categoryName = category?.name ?? null;
    product.price = body.price ?? null;
    product.thumbnailKey = body.thumbnailKey ?? null;
    product.imageKeys = body.imageKeys ?? [];
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("*/api/v1/products/:id", ({ params }) => {
    const index = products.findIndex((item) => item.id === params.id);
    if (index >= 0) {
      products.splice(index, 1);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

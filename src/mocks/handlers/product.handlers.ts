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
  // TODO(fe-api): 판매자 본인 상품 목록(provisional). BE 에 sellerId 필터/`/products/me` 추가 필요.
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

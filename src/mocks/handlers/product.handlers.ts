import { HttpResponse, http } from "msw";

import type { ProductPage } from "@/features/product/model/product.schema";
import { products } from "../data/products";

export const productHandlers = [
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

    const start = page * size;
    const body: ProductPage = {
      content: filtered.slice(start, start + size),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    };
    return HttpResponse.json(body);
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
];

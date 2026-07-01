import { HttpResponse, http } from "msw";
import { uuid } from "@/shared/lib/id";

import { categories } from "../data/categories";

export const categoryHandlers = [
  http.get("*/api/v1/categories", () => HttpResponse.json(categories)),

  http.post("*/api/v1/categories", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    const id = `c-${uuid().slice(0, 8)}`;
    categories.push({ id, name: body.name });
    return new HttpResponse(null, {
      status: 201,
      headers: { Location: `/api/v1/categories/${id}` },
    });
  }),

  http.patch("*/api/v1/categories/:id", async ({ params, request }) => {
    const body = (await request.json()) as { name: string };
    const category = categories.find((item) => item.id === params.id);
    if (!category) {
      return HttpResponse.json(
        { error: "CATEGORY_NOT_FOUND", message: "카테고리를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    category.name = body.name;
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("*/api/v1/categories/:id", ({ params }) => {
    const index = categories.findIndex((item) => item.id === params.id);
    if (index >= 0) {
      categories.splice(index, 1);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

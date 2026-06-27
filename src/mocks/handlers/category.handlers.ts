import { HttpResponse, http } from "msw";

import { categories } from "../data/categories";

export const categoryHandlers = [
  http.get("*/api/v1/categories", () => HttpResponse.json(categories)),
];

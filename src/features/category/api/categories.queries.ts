import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchCategories } from "./categories.api";

export const categoryQueries = {
  list: () =>
    queryOptions({
      queryKey: ["categories", "list"] as const,
      queryFn: fetchCategories,
      staleTime: 5 * 60_000,
    }),
};

export function useCategories() {
  return useQuery(categoryQueries.list());
}

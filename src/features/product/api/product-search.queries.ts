import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/shared/api/http";
import {
  type ProductSearchPage,
  type ProductSearchSort,
  productSearchPageSchema,
} from "../model/product-search.schema";

export type ProductSearchRequest = {
  query: string | null;
  categoryName: string | null;
  startPrice: number | null;
  endPrice: number | null;
  page: number;
  size: number;
  sort: ProductSearchSort;
};

export const INITIAL_PRODUCT_SEARCH_REQUEST: ProductSearchRequest = {
  query: null,
  categoryName: null,
  startPrice: null,
  endPrice: null,
  page: 0,
  size: 50,
  sort: "createdAt,desc",
};

export const productSearchQueries = {
  list: (request: ProductSearchRequest) =>
    queryOptions({
      queryKey: ["products", "search", request] as const,
      queryFn: (): Promise<ProductSearchPage> =>
        apiFetch("/api/v1/searchs/search", productSearchPageSchema, {
          method: "POST",
          body: request,
          auth: false,
        }),
      placeholderData: keepPreviousData,
    }),
};

export function useProductSearch(request: ProductSearchRequest) {
  return useQuery(productSearchQueries.list(request));
}

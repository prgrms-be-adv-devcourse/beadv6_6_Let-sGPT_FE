import { queryOptions, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/shared/api/client";
import { type ProductPage, productPageSchema } from "../model/product.schema";

type ProductListParams = {
  page?: number;
  size?: number;
};

/**
 * 서버 상태는 TanStack Query 로 표준화한다(§2). queryOptions 로 키/페처를 한 곳에 묶어
 * 컴포넌트·프리패치·테스트가 같은 정의를 재사용하도록 한다.
 */
export const productQueries = {
  list: (params: ProductListParams = {}) =>
    queryOptions({
      queryKey: ["products", "list", params] as const,
      queryFn: async (): Promise<ProductPage> => {
        const { data, error } = await apiClient.GET("/api/v1/products", {
          params: { query: params },
        });
        if (error) {
          throw new Error("상품 목록 조회에 실패했습니다.");
        }
        // 코드젠 타입과 별개로 실제 응답을 런타임 검증(계약 드리프트를 즉시 노출).
        return productPageSchema.parse(data);
      },
    }),
};

export function useProductList(params: ProductListParams = {}) {
  return useQuery(productQueries.list(params));
}

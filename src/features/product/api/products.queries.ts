import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { resolveSellerAuth } from "@/features/auth/api/auth.api";
import { apiClient } from "@/shared/api/client";
import { apiFetch } from "@/shared/api/http";
import {
  type ProductPage,
  type ProductWriteBody,
  productPageSchema,
  productSchema,
} from "../model/product.schema";
import { createProduct, deleteProduct, getMyProducts, updateProduct } from "./products.api";

export type ProductListParams = {
  categoryId?: string;
  keyword?: string;
  sort?: string;
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
  detail: (id: string) =>
    queryOptions({
      queryKey: ["products", "detail", id] as const,
      queryFn: () => apiFetch(`/api/v1/products/${id}`, productSchema),
    }),
};

export function useProductList(params: ProductListParams = {}) {
  return useQuery(productQueries.list(params));
}

export function useProduct(id: string) {
  return useQuery(productQueries.detail(id));
}

// ── 판매자 콘솔 ───────────────────────────────────────────────────────────
export const myProductQueries = {
  list: (params: { page?: number; size?: number } = {}) =>
    queryOptions({
      queryKey: ["products", "me", params] as const,
      queryFn: () => getMyProducts(params),
    }),
};

export function useMyProducts(params: { page?: number; size?: number } = {}) {
  return useQuery(myProductQueries.list(params));
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sellerInfoId: string; body: ProductWriteBody }) => {
      const auth = await resolveSellerAuth(input.sellerInfoId);
      return createProduct(input.body, auth);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sellerInfoId: string; id: string; body: ProductWriteBody }) => {
      const auth = await resolveSellerAuth(input.sellerInfoId);
      return updateProduct(input.id, input.body, auth);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sellerInfoId: string; id: string }) => {
      const auth = await resolveSellerAuth(input.sellerInfoId);
      return deleteProduct(input.id, auth);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

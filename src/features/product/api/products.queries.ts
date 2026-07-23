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

/**
 * 브랜드(셀러) 상품 모아보기.
 *
 * 공개 `GET /api/v1/products` 에 sellerId 필터가 없어(계약 확인) **클라이언트 사이드**로 좁힌다.
 * ⚠️ 한계: "받아온 페이지 범위"(size=BRAND_FETCH_SIZE)만 커버 — 전량 필터는 불가. 전량 로딩은
 * 성능상 지양. BE 에 sellerId 필터가 생기면 이 한 곳의 queryFn 만 교체하면 된다(필터 지점 단일화).
 */
export const BRAND_FETCH_SIZE = 200;

export function useProductsBySeller(sellerName: string) {
  return useQuery({
    ...productQueries.list({ size: BRAND_FETCH_SIZE }),
    select: (page: ProductPage) =>
      page.content.filter((product) => product.sellerName === sellerName),
  });
}

/**
 * 전 브랜드(셀러) 목록 — products 응답의 distinct sellerName 에서 파생(전용 셀러 API 없음).
 * 브랜드 디렉토리(/brands) 용. useProductsBySeller 와 동일한 한계·교체 지점을 공유한다.
 */
export function useBrandNames() {
  return useQuery({
    ...productQueries.list({ size: BRAND_FETCH_SIZE }),
    select: (page: ProductPage) =>
      [
        ...new Set(
          page.content
            .map((product) => product.sellerName)
            .filter((name): name is string => Boolean(name)),
        ),
      ].sort((a, b) => a.localeCompare(b, "ko")),
  });
}

// ── 판매자 콘솔 ───────────────────────────────────────────────────────────
export const myProductQueries = {
  list: (sellerInfoId: string, params: { page?: number; size?: number } = {}) =>
    queryOptions({
      queryKey: ["products", "me", sellerInfoId, params] as const,
      queryFn: async () => getMyProducts(params, await resolveSellerAuth(sellerInfoId)),
    }),
};

export function useMyProducts(sellerInfoId: string, params: { page?: number; size?: number } = {}) {
  return useQuery(myProductQueries.list(sellerInfoId, params));
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

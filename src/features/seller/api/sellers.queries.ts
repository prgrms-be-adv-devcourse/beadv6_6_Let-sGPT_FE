import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createSellerInfo, getMySellerInfos } from "./sellers.api";

export const sellerQueries = {
  mine: (params: { isActive?: boolean } = {}) =>
    queryOptions({
      queryKey: ["sellers", "me", params] as const,
      queryFn: () => getMySellerInfos(params),
    }),
};

export function useMySellerInfos(params: { isActive?: boolean } = {}) {
  return useQuery(sellerQueries.mine(params));
}

/** 판매자 콘솔용 활성 판매자정보(없으면 첫 항목, 그것도 없으면 null) + 로딩 상태. */
export function useActiveSellerInfo() {
  const query = useMySellerInfos();
  const sellers = query.data ?? [];
  const active = sellers.find((seller) => seller.active) ?? sellers[0] ?? null;
  return { sellerInfo: active, isPending: query.isPending, isError: query.isError };
}

export function useCreateSellerInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSellerInfo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers"] }),
  });
}

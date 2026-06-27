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

export function useCreateSellerInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSellerInfo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers"] }),
  });
}

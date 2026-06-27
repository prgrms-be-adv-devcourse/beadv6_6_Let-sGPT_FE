import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getSellerSettlements,
  getSettlementOrders,
  retryFailedSettlements,
  type SettlementFilter,
  type SettlementScope,
} from "./settlements.api";

export const settlementQueries = {
  orders: (scope: SettlementScope, filter: SettlementFilter = {}) =>
    queryOptions({
      queryKey: ["settlements", scope, "orders", filter] as const,
      queryFn: () => getSettlementOrders(scope, filter),
    }),
  sellers: (scope: SettlementScope, filter: SettlementFilter = {}) =>
    queryOptions({
      queryKey: ["settlements", scope, "sellers", filter] as const,
      queryFn: () => getSellerSettlements(scope, filter),
    }),
};

export function useSettlementOrders(scope: SettlementScope, filter: SettlementFilter = {}) {
  return useQuery(settlementQueries.orders(scope, filter));
}

export function useSellerSettlements(scope: SettlementScope, filter: SettlementFilter = {}) {
  return useQuery(settlementQueries.sellers(scope, filter));
}

export function useRetryFailedSettlements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryFailedSettlements,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settlements"] }),
  });
}

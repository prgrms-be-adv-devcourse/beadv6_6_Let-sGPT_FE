import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getSellerSettlements,
  getSettlementBatchResults,
  getSettlementOrders,
  retryFailedSettlements,
  type SettlementBatchResultFilter,
  type SettlementFilter,
  type SettlementOrderFilter,
  type SettlementScope,
} from "./settlements.api";

export const settlementQueries = {
  orders: (scope: SettlementScope, filter: SettlementOrderFilter = {}) =>
    queryOptions({
      queryKey: ["settlements", scope, "orders", filter] as const,
      queryFn: () => getSettlementOrders(scope, filter),
    }),
  sellers: (scope: SettlementScope, sellerId: string | undefined, filter: SettlementFilter = {}) =>
    queryOptions({
      queryKey: ["settlements", scope, "sellers", sellerId, filter] as const,
      queryFn: () => getSellerSettlements(scope, sellerId, filter),
    }),
  batchResults: (filter: SettlementBatchResultFilter = {}) =>
    queryOptions({
      queryKey: ["settlements", "admin", "batch-results", filter] as const,
      queryFn: () => getSettlementBatchResults(filter),
    }),
};

export function useSettlementOrders(
  scope: SettlementScope,
  filter: SettlementOrderFilter = {},
  enabled = true,
) {
  return useQuery({ ...settlementQueries.orders(scope, filter), enabled });
}

export function useSellerSettlements(
  scope: SettlementScope,
  sellerId: string | undefined,
  filter: SettlementFilter = {},
  enabled = true,
) {
  return useQuery({ ...settlementQueries.sellers(scope, sellerId, filter), enabled });
}

export function useSettlementBatchResults(
  filter: SettlementBatchResultFilter = {},
  enabled = true,
) {
  return useQuery({ ...settlementQueries.batchResults(filter), enabled });
}

export function useRetryFailedSettlements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryFailedSettlements,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settlements"] }),
  });
}

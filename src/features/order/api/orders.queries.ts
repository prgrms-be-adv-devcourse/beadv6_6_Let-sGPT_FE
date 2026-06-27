import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { OrderStatus } from "../model/order.schema";
import { cancelOrder, createOrder, getMyOrders, getOrder } from "./orders.api";

type OrderListParams = { status?: OrderStatus; page?: number; size?: number };

export const orderQueries = {
  detail: (orderId: string) =>
    queryOptions({
      queryKey: ["orders", "detail", orderId] as const,
      queryFn: () => getOrder(orderId),
    }),
  list: (params: OrderListParams = {}) =>
    queryOptions({
      queryKey: ["orders", "list", params] as const,
      queryFn: () => getMyOrders(params),
    }),
};

export function useOrder(orderId: string) {
  return useQuery(orderQueries.detail(orderId));
}

export function useMyOrders(params: OrderListParams = {}) {
  return useQuery(orderQueries.list(params));
}

export function useCreateOrder() {
  return useMutation({ mutationFn: createOrder });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

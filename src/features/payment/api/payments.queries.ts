import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  chargeWallet,
  confirmPayment,
  confirmWalletCharge,
  createPayment,
  getRefundHistories,
  getWalletBalance,
  requestRefund,
} from "./payments.api";

export const refundQueries = {
  histories: (params: { page?: number; size?: number } = {}) =>
    queryOptions({
      queryKey: ["refunds", "histories", params] as const,
      queryFn: () => getRefundHistories(params),
    }),
};

export const walletQueries = {
  balance: () =>
    queryOptions({ queryKey: ["wallet", "balance"] as const, queryFn: getWalletBalance }),
};

export function useWalletBalance() {
  return useQuery(walletQueries.balance());
}

export function useRefundHistories(params: { page?: number; size?: number } = {}) {
  return useQuery(refundQueries.histories(params));
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useChargeWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chargeWallet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallet"] }),
  });
}

export function useConfirmWalletCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmWalletCharge,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallet"] }),
  });
}

export function useRequestRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestRefund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

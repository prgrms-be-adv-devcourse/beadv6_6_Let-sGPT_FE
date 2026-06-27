import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  chargeWallet,
  confirmPayment,
  confirmWalletCharge,
  createPayment,
  getRefundHistories,
  requestRefund,
} from "./payments.api";

export const refundQueries = {
  histories: (params: { page?: number; size?: number } = {}) =>
    queryOptions({
      queryKey: ["refunds", "histories", params] as const,
      queryFn: () => getRefundHistories(params),
    }),
};

export function useRefundHistories(params: { page?: number; size?: number } = {}) {
  return useQuery(refundQueries.histories(params));
}

export function useCreatePayment() {
  return useMutation({ mutationFn: createPayment });
}

export function useConfirmPayment() {
  return useMutation({ mutationFn: confirmPayment });
}

export function useChargeWallet() {
  return useMutation({ mutationFn: chargeWallet });
}

export function useConfirmWalletCharge() {
  return useMutation({ mutationFn: confirmWalletCharge });
}

export function useRequestRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestRefund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

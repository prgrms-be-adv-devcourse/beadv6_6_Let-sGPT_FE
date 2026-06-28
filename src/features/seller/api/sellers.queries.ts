import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ensureSellerToken } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useActiveSellerStore } from "../store/activeSellerStore";
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

/**
 * 판매자 콘솔용 활성 판매자정보. 선택은 클라 SSOT(activeSellerId)가 우선이고,
 * 없으면 서버 active 플래그, 그것도 없으면 첫 항목(없으면 null) + 로딩 상태.
 */
export function useActiveSellerInfo() {
  const query = useMySellerInfos();
  const activeId = useActiveSellerStore((state) => state.activeSellerId);
  const sellers = query.data ?? [];
  const active =
    sellers.find((seller) => seller.id === activeId) ??
    sellers.find((seller) => seller.active) ??
    sellers[0] ??
    null;
  return { sellerInfo: active, isPending: query.isPending, isError: query.isError };
}

/**
 * 활성 스토어 전환 — 단일 출처(activeSellerId)를 즉시 갱신하고, 그 스토어 범위의
 * 판매자 토큰을 선재발급한다(proactive). 재발급 실패는 삼킨다: 다음 write 의
 * resolveSellerAuth(ensureSellerToken·reauth)가 안전망으로 재시도한다.
 */
export function switchActiveSeller(sellerInfoId: string): void {
  if (useActiveSellerStore.getState().activeSellerId === sellerInfoId) {
    return;
  }
  useActiveSellerStore.getState().setActiveSellerId(sellerInfoId);
  useAuthStore.getState().clearSellerToken();
  // 선재발급 실패는 write 시점에 재시도되므로 무시한다(안전망).
  void ensureSellerToken(sellerInfoId).catch(() => undefined);
}

export function useCreateSellerInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSellerInfo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers"] }),
  });
}

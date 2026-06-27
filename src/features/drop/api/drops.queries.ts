import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { exchangeScopedToken } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { DropCreateBody } from "../model/drop.schema";
import { createDrop, type FetchDropsParams, fetchDrops, getDrop } from "./drops.api";

export const dropQueries = {
  ongoing: () =>
    queryOptions({
      queryKey: ["drops", "ongoing"] as const,
      queryFn: () => fetchDrops({ status: "OPEN" }),
    }),
  upcoming: () =>
    queryOptions({
      queryKey: ["drops", "upcoming"] as const,
      queryFn: () => fetchDrops({ status: "REGISTERED" }),
    }),
  list: (params: FetchDropsParams = {}) =>
    queryOptions({
      queryKey: ["drops", "list", params] as const,
      queryFn: () => fetchDrops(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ["drops", "detail", id] as const,
      queryFn: () => getDrop(id),
    }),
};

/** 진행중(OPEN) 드롭 목록 — 홈 "진행중 드롭 카드 목록". */
export function useOngoingDrops() {
  return useQuery(dropQueries.ongoing());
}

/** 오픈 예정(REGISTERED) 드롭 목록 — 홈 히어로. */
export function useUpcomingDrops() {
  return useQuery(dropQueries.upcoming());
}

/** 전체/상태별 드롭 목록 — 드롭 목록 화면. */
export function useDropList(params: FetchDropsParams = {}) {
  return useQuery(dropQueries.list(params));
}

/** 드롭 단건 — 드롭 상세 화면. */
export function useDrop(id: string) {
  return useQuery(dropQueries.detail(id));
}

/** 드롭 생성(판매자) — scoped 토큰 교환 후 POST /drops. 성공 시 드롭 캐시 무효화. */
export function useCreateDrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sellerInfoId: string; body: DropCreateBody }) => {
      const subjectToken = useAuthStore.getState().accessToken;
      if (!subjectToken) {
        throw new Error("로그인이 필요합니다.");
      }
      const token = await exchangeScopedToken({ subjectToken, sellerInfoId: input.sellerInfoId });
      return createDrop(input.body, token);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drops"] }),
  });
}

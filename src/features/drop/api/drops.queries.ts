import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchDropsByStatus } from "./drops.api";

export const dropQueries = {
  ongoing: () =>
    queryOptions({
      queryKey: ["drops", "ongoing"] as const,
      queryFn: () => fetchDropsByStatus("OPEN"),
    }),
  upcoming: () =>
    queryOptions({
      queryKey: ["drops", "upcoming"] as const,
      queryFn: () => fetchDropsByStatus("REGISTERED"),
    }),
};

/** 진행중(OPEN) 드롭 목록 — 홈 "진행중 드롭 카드 목록". */
export function useOngoingDrops() {
  return useQuery(dropQueries.ongoing());
}

/** 오픈 예정(REGISTERED) 드롭 목록 — 홈 "한정판 오픈 예정 배너". */
export function useUpcomingDrops() {
  return useQuery(dropQueries.upcoming());
}

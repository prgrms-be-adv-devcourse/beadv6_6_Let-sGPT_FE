import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuthStore } from "@/features/auth/store/authStore";
import type { WishlistPage } from "../model/wishlist.schema";
import { getWishlist, setWishlist } from "./wishlist.api";

// 찜 상태는 productId Set 하나로 전 화면(상세·카드)이 공유하므로 단일 캐시로 모은다.
const WISHLIST_KEY = ["wishlist"] as const;

export const wishlistQueries = {
  all: () =>
    queryOptions({
      queryKey: WISHLIST_KEY,
      // 토글 상태 판별용 — 목록 화면이 아니라 "찜한 productId 집합"이 목적이라 넉넉히 받는다.
      queryFn: () => getWishlist({ size: 200 }),
    }),
};

/**
 * 로그인 상태에서만 위시리스트를 조회해 찜한 productId 집합을 돌려준다.
 * 비로그인 시 요청하지 않고(enabled:false) 빈 집합.
 */
export function useWishlistIds() {
  const isLoggedIn = useAuthStore((state) => Boolean(state.member));
  const query = useQuery({ ...wishlistQueries.all(), enabled: isLoggedIn });
  const ids = useMemo(
    () => new Set((query.data?.content ?? []).map((item) => item.productId)),
    [query.data],
  );
  return { ids, isLoggedIn, isLoading: isLoggedIn && query.isLoading };
}

/** 찜 토글 — 낙관적 업데이트 후 서버 상태로 정합화(onSettled invalidate). */
export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, wished }: { productId: string; wished: boolean }) =>
      setWishlist(productId, wished),
    onMutate: async ({ productId, wished }) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEY });
      const previous = queryClient.getQueryData<WishlistPage>(WISHLIST_KEY);
      queryClient.setQueryData<WishlistPage>(WISHLIST_KEY, (old) => {
        if (!old) {
          return old;
        }
        const content = wished
          ? old.content.some((item) => item.productId === productId)
            ? old.content
            : [...old.content, { productId }]
          : old.content.filter((item) => item.productId !== productId);
        return { ...old, content };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WISHLIST_KEY, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  });
}

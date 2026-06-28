import { create } from "zustand";
import { persist } from "zustand/middleware";

type ActiveSellerState = {
  /** 현재 활성 스토어(판매자정보) id — 멀티스토어 전환의 단일 출처(SSOT). */
  activeSellerId: string | null;
  setActiveSellerId: (id: string | null) => void;
};

/**
 * 활성 스토어 선택 상태. 멀티테넌트(스토어)에서 "어떤 스토어로 동작 중인가"의 단일 출처다.
 * 헤더 전환기·판매자 콘솔·write 흐름이 모두 이 값을 본다(authorization 은 스토어 범위).
 * id 만 영속화하고, 그 스토어 범위의 판매자 토큰은 authStore 에 메모리로만 둔다(전환 시 재발급).
 */
export const useActiveSellerStore = create<ActiveSellerState>()(
  persist(
    (set) => ({
      activeSellerId: null,
      setActiveSellerId: (id) => set({ activeSellerId: id }),
    }),
    { name: "openat-active-seller" },
  ),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Member, TokenResponse } from "../model/auth.schema";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  member: Member | null;
  /** 스토어(sellerInfoId) 범위 판매자 JWT·그 범위·만료시각(ms). 단명이라 메모리에만 보관(persist 제외). */
  sellerToken: string | null;
  sellerTokenStoreId: string | null;
  sellerTokenExpiresAt: number | null;
  setSession: (token: TokenResponse, member: Member) => void;
  setMember: (member: Member) => void;
  setSellerToken: (token: string, sellerInfoId: string, expiresAt: number) => void;
  clearSellerToken: () => void;
  clear: () => void;
};

/** 클라이언트 인증 상태(전역 UI 상태) — 토큰·회원정보를 localStorage 에 영속화. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      member: null,
      sellerToken: null,
      sellerTokenStoreId: null,
      sellerTokenExpiresAt: null,
      setSession: (token, member) =>
        set({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          member,
        }),
      setMember: (member) => set({ member }),
      setSellerToken: (token, sellerInfoId, expiresAt) =>
        set({
          sellerToken: token,
          sellerTokenStoreId: sellerInfoId,
          sellerTokenExpiresAt: expiresAt,
        }),
      clearSellerToken: () =>
        set({ sellerToken: null, sellerTokenStoreId: null, sellerTokenExpiresAt: null }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          member: null,
          sellerToken: null,
          sellerTokenStoreId: null,
          sellerTokenExpiresAt: null,
        }),
    }),
    {
      name: "openat-auth",
      // 판매자 토큰은 단명·스토어 범위라 영속화하지 않는다(메모리 전용, 전환 시 재발급).
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        member: state.member,
      }),
    },
  ),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Member, TokenResponse } from "../model/auth.schema";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  member: Member | null;
  setSession: (token: TokenResponse, member: Member) => void;
  clear: () => void;
};

/** 클라이언트 인증 상태(전역 UI 상태) — 토큰·회원정보를 localStorage 에 영속화. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      member: null,
      setSession: (token, member) =>
        set({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          member,
        }),
      clear: () => set({ accessToken: null, refreshToken: null, member: null }),
    }),
    { name: "openat-auth" },
  ),
);

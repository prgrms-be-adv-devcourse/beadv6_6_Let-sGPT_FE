import type { Member } from "@/features/auth/model/auth.schema";
import { useAuthStore } from "@/features/auth/store/authStore";

/**
 * 라우터 context 로 주입하는 인증 뷰.
 * 라우트/가드가 authStore 에 직접 의존하지 않고 `context.auth` 만 바라보도록 경계를 둔다(§5).
 * 게터로 매 접근 시 store 의 현재 값을 읽으므로 beforeLoad 는 항상 최신 상태로 평가된다.
 */
export const authContext = {
  get member(): Member | null {
    return useAuthStore.getState().member;
  },
  get isAuthenticated(): boolean {
    return Boolean(useAuthStore.getState().member);
  },
};

export type AuthContext = typeof authContext;

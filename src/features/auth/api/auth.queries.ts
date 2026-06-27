import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { LoginFormValues, SignupFormValues } from "../model/auth.schema";
import { useAuthStore } from "../store/authStore";
import { getMe, loginRequest, meRequest, signupRequest, updateMember } from "./auth.api";

export const memberQueries = {
  me: () => queryOptions({ queryKey: ["members", "me"] as const, queryFn: getMe }),
};

/** 로그인 사용자의 최신 회원정보(서버 기준) — 마이페이지 표기. */
export function useMe() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({ ...memberQueries.me(), enabled: Boolean(accessToken) });
}

/** 회원 정보 수정 → 성공 시 캐시·세션 스토어를 함께 갱신. */
export function useUpdateMember() {
  const queryClient = useQueryClient();
  const setMember = useAuthStore((state) => state.setMember);
  return useMutation({
    mutationFn: updateMember,
    onSuccess: (member) => {
      setMember(member);
      queryClient.setQueryData(memberQueries.me().queryKey, member);
    },
  });
}

/** 로그인 → 토큰 발급 후 /me 로 회원정보를 받아 세션에 저장. */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const token = await loginRequest(values);
      const member = await meRequest(token.accessToken);
      return { token, member };
    },
    onSuccess: ({ token, member }) => setSession(token, member),
  });
}

/** 회원가입 → MemberResponse 반환(자동 로그인은 하지 않고 로그인 화면으로 유도). */
export function useSignup() {
  return useMutation({
    mutationFn: (values: SignupFormValues) =>
      signupRequest({
        email: values.email,
        password: values.password,
        nickname: values.nickname,
      }),
  });
}

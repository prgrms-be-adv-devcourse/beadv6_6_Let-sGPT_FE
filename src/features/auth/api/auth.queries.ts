import { useMutation } from "@tanstack/react-query";

import type { LoginFormValues, SignupFormValues } from "../model/auth.schema";
import { useAuthStore } from "../store/authStore";
import { loginRequest, meRequest, signupRequest } from "./auth.api";

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

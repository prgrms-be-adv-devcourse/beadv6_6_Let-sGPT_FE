import { z } from "zod";

// ── BE 계약 (member 도메인) ───────────────────────────────────────────────
export const roleSchema = z.enum(["ROLE_USER", "ROLE_SELLER", "ROLE_ADMIN"]);
export type Role = z.infer<typeof roleSchema>;

export const platformTypeSchema = z.enum(["LOCAL", "KAKAO", "GOOGLE", "NAVER"]);

/** `MemberResponse` */
export const memberSchema = z.object({
  id: z.string(),
  email: z.string(),
  nickname: z.string(),
  role: roleSchema,
  platformType: platformTypeSchema,
});
export type Member = z.infer<typeof memberSchema>;

/** `TokenResponse` (로그인/리프레시) */
export const tokenResponseSchema = z.object({
  tokenType: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});
export type TokenResponse = z.infer<typeof tokenResponseSchema>;

// ── 폼 스키마 (BE 검증 제약과 일치) ──────────────────────────────────────
export const loginFormSchema = z.object({
  email: z.string().min(1, "이메일을 입력하세요.").pipe(z.email("올바른 이메일 형식이 아닙니다.")),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const signupFormSchema = z
  .object({
    email: z
      .string()
      .min(1, "이메일을 입력하세요.")
      .pipe(z.email("올바른 이메일 형식이 아닙니다.")),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상이어야 합니다.")
      .max(64, "비밀번호는 64자 이하여야 합니다."),
    confirmPassword: z.string(),
    nickname: z.string().min(1, "닉네임을 입력하세요.").max(30, "닉네임은 30자 이하여야 합니다."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });
export type SignupFormValues = z.infer<typeof signupFormSchema>;

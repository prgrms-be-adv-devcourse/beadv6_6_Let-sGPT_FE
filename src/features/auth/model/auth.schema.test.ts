import { describe, expect, it } from "vitest";

import { loginFormSchema, signupFormSchema } from "./auth.schema";

const validSignup = {
  email: "user@openat.kr",
  password: "password1",
  confirmPassword: "password1",
  nickname: "오픈앳",
};

describe("signupFormSchema (BE 제약 반영)", () => {
  it("유효한 입력을 통과시킨다", () => {
    expect(signupFormSchema.safeParse(validSignup).success).toBe(true);
  });

  it("8자 미만 비밀번호를 거부한다", () => {
    const result = signupFormSchema.safeParse({
      ...validSignup,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("비밀번호 확인이 다르면 거부한다", () => {
    expect(
      signupFormSchema.safeParse({ ...validSignup, confirmPassword: "different1" }).success,
    ).toBe(false);
  });

  it("이메일 형식이 아니면 거부한다", () => {
    expect(signupFormSchema.safeParse({ ...validSignup, email: "not-email" }).success).toBe(false);
  });

  it("닉네임 30자 초과를 거부한다", () => {
    expect(signupFormSchema.safeParse({ ...validSignup, nickname: "가".repeat(31) }).success).toBe(
      false,
    );
  });
});

describe("loginFormSchema", () => {
  it("빈 비밀번호를 거부한다", () => {
    expect(loginFormSchema.safeParse({ email: "user@openat.kr", password: "" }).success).toBe(
      false,
    );
  });
});

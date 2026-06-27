import { apiFetch } from "@/shared/api/http";
import {
  type Member,
  memberSchema,
  type TokenResponse,
  tokenResponseSchema,
} from "../model/auth.schema";

// member 도메인은 BE에 구현되어 있으나(POST /api/v1/members, /login, GET /me) 아직 코드젠 스펙에
// 없으므로 직접 fetch + Zod 경계검증을 쓴다. 게이트웨이 스펙에 잡히면 apiClient 로 이관.

const baseUrl = import.meta.env.VITE_API_BASE_URL;

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { message?: unknown };
    return typeof data.message === "string" ? data.message : fallback;
  } catch {
    return fallback;
  }
}

export async function signupRequest(body: {
  email: string;
  password: string;
  nickname: string;
}): Promise<Member> {
  const response = await fetch(new URL("/api/v1/members", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "회원가입에 실패했습니다."));
  }
  return memberSchema.parse(await response.json());
}

export async function loginRequest(body: {
  email: string;
  password: string;
}): Promise<TokenResponse> {
  const response = await fetch(new URL("/api/v1/members/login", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "이메일 또는 비밀번호를 확인하세요."));
  }
  return tokenResponseSchema.parse(await response.json());
}

export async function meRequest(accessToken: string): Promise<Member> {
  const response = await fetch(new URL("/api/v1/members/me", baseUrl), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "내 정보를 불러오지 못했습니다."));
  }
  return memberSchema.parse(await response.json());
}

/** 내 정보 조회(GET /me) — 토큰은 apiFetch 가 provider 로 주입. */
export function getMe(): Promise<Member> {
  return apiFetch("/api/v1/members/me", memberSchema);
}

/** 회원 정보 수정(PATCH /me) — nickname·password 부분 갱신. */
export function updateMember(body: { nickname?: string; password?: string }): Promise<Member> {
  return apiFetch("/api/v1/members/me", memberSchema, { method: "PATCH", body });
}

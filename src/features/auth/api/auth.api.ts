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

// ── RFC 8693 토큰 교환(판매자 상품/드롭 write 용 scoped 토큰) ────────────────
// 게이트웨이가 아닌 member 서비스가 직접 처리(`/auth/token`, form-urlencoded). access JWT 를
// sellerInfoId 범위의 scoped 토큰으로 교환한다. 상품/드롭 write 호출에 이 토큰을 실어 보낸다.
const GRANT_TYPE_TOKEN_EXCHANGE = "urn:ietf:params:oauth:grant-type:token-exchange";
const TOKEN_TYPE_JWT = "urn:ietf:params:oauth:token-type:jwt";
const AUDIENCE_PRODUCT = "openat-product";
const SCOPE_PRODUCT_WRITE = "product:write";
const RESOURCE_SELLER_PREFIX = "urn:openat:seller:";

/** access 토큰 → 해당 판매자정보(sellerInfoId) 범위의 scoped 토큰으로 교환. */
export async function exchangeScopedToken(input: {
  subjectToken: string;
  sellerInfoId: string;
}): Promise<string> {
  const form = new URLSearchParams({
    grant_type: GRANT_TYPE_TOKEN_EXCHANGE,
    subject_token: input.subjectToken,
    subject_token_type: TOKEN_TYPE_JWT,
    requested_token_type: TOKEN_TYPE_JWT,
    audience: AUDIENCE_PRODUCT,
    scope: SCOPE_PRODUCT_WRITE,
    resource: `${RESOURCE_SELLER_PREFIX}${input.sellerInfoId}`,
  });
  const response = await fetch(new URL("/auth/token", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "판매자 인증에 실패했습니다."));
  }
  const data = (await response.json()) as { access_token?: unknown };
  if (typeof data.access_token !== "string") {
    throw new Error("scoped 토큰 응답이 올바르지 않습니다.");
  }
  return data.access_token;
}

import { apiFetch } from "@/shared/api/http";
import {
  type Member,
  memberSchema,
  sellerTokenResponseSchema,
  type TokenResponse,
  tokenResponseSchema,
} from "../model/auth.schema";
import { useAuthStore } from "../store/authStore";

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

// ── 판매자 토큰(스토어 범위) — 토큰 매니저 ────────────────────────────────
// 판매자 JWT 는 회원 JWT 와 별도이며 스토어(sellerInfoId) 단위로 발급된다. 회원 도메인에
// 재발급을 요청(회원 JWT 로 인증)하면 해당 스토어 범위의 판매자 JWT 를 돌려준다. 상품/드롭
// write 는 이 토큰을 실어 보낸다. 토큰은 단명이라 메모리에만 보관하고(authStore, persist 제외):
//   - proactive : 만료 임박(스큐 이내)·스토어 변경·미보유면 미리 재발급
//   - reactive  : write 가 401 이면 강제 재발급 후 1회 재시도(apiFetch reauth)
//   - single-flight: 동시 재발급을 하나의 비행으로 합쳐 race·중복 호출 방지
// BE 구현됨(SellerController.issueSellerToken): POST /api/v1/seller/token { sellerInfoId }
//   -> { tokenType, accessToken, expiresIn }. 회원 access 토큰으로 인증(authenticatedAndNotScoped).

/** 만료 이 시간(ms) 이내면 미리 재발급(401 왕복 최소화). 만료 자체는 reauth 가 최종 복구. */
const SELLER_TOKEN_REFRESH_SKEW_MS = 15_000;

/** 동일 스토어 동시 재발급을 하나로 합치는 single-flight 상태. */
let inflightReissue: { sellerInfoId: string; promise: Promise<string> } | null = null;

async function fetchAndStoreSellerToken(sellerInfoId: string): Promise<string> {
  const res = await apiFetch("/api/v1/seller/token", sellerTokenResponseSchema, {
    method: "POST",
    body: { sellerInfoId },
  });
  const expiresAt = Date.now() + res.expiresIn * 1000;
  useAuthStore.getState().setSellerToken(res.accessToken, sellerInfoId, expiresAt);
  return res.accessToken;
}

/** 스토어 범위 판매자 토큰을 강제 재발급한다(동시 호출은 single-flight 로 합쳐짐). */
export function reissueSellerToken(sellerInfoId: string): Promise<string> {
  if (inflightReissue && inflightReissue.sellerInfoId === sellerInfoId) {
    return inflightReissue.promise;
  }
  if (!useAuthStore.getState().accessToken) {
    return Promise.reject(new Error("로그인이 필요합니다."));
  }
  const promise = fetchAndStoreSellerToken(sellerInfoId).finally(() => {
    if (inflightReissue?.promise === promise) {
      inflightReissue = null;
    }
  });
  inflightReissue = { sellerInfoId, promise };
  return promise;
}

/**
 * 활성 스토어 범위의 유효한 판매자 토큰을 보장한다(proactive).
 * 같은 스토어의 토큰이 만료 스큐 밖이면 재사용하고, 아니면(스토어 변경·만료 임박·미보유) 재발급한다.
 */
export function ensureSellerToken(sellerInfoId: string): Promise<string> {
  const { sellerToken, sellerTokenStoreId, sellerTokenExpiresAt } = useAuthStore.getState();
  if (
    sellerToken !== null &&
    sellerTokenStoreId === sellerInfoId &&
    sellerTokenExpiresAt !== null &&
    sellerTokenExpiresAt - SELLER_TOKEN_REFRESH_SKEW_MS > Date.now()
  ) {
    return Promise.resolve(sellerToken);
  }
  return reissueSellerToken(sellerInfoId);
}

/** 상품/드롭 write 용 판매자 인증 묶음 — 토큰 + 401 시 강제 재발급(reauth). */
export type SellerAuth = { token: string; reauth: () => Promise<string> };

/** write 직전 호출: 유효 토큰을 확보하고 401 복구용 reauth 를 함께 돌려준다. */
export async function resolveSellerAuth(sellerInfoId: string): Promise<SellerAuth> {
  return {
    token: await ensureSellerToken(sellerInfoId),
    reauth: () => reissueSellerToken(sellerInfoId),
  };
}

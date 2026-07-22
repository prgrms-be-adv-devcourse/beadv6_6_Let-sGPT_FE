import type { ZodType } from "zod";

/**
 * 인증 토큰 접근을 shared 레이어와 분리(boundary)하기 위한 프로바이더 주입.
 * 앱 시작 시 auth 피처가 authStore 게터를 등록한다(app/providers.tsx).
 */
let accessTokenProvider: () => string | null = () => null;
export function setAccessTokenProvider(provider: () => string | null) {
  accessTokenProvider = provider;
}

/**
 * 회원 access 토큰이 만료(401)되면 refresh 토큰으로 재발급하는 핸들러.
 * 성공 시 새 accessToken, 갱신 불가/실패 시 null 을 반환한다(세션 정리는 핸들러 책임).
 * auth 피처가 앱 시작 시 등록한다(app/providers.tsx) — shared ↔ auth 경계 분리.
 */
let tokenRefreshHandler: (() => Promise<string | null>) | null = null;
export function setTokenRefreshHandler(handler: () => Promise<string | null>) {
  tokenRefreshHandler = handler;
}

/** BE 공통 에러 포맷 `{ error, message }` 를 담는 에러. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
  /** 응답 미디어 타입 지정(SSE 등). */
  accept?: string;
  /** 호출 취소 신호. 스트리밍 요청의 연결 해제에도 사용한다. */
  signal?: AbortSignal;
  /** false 면 Authorization 미부착(공개 엔드포인트). */
  auth?: boolean;
  /** 토큰을 명시적으로 override(로그인 직후 /me 처럼 store 반영 전 호출용). */
  token?: string;
  /**
   * 401 응답 시 새 토큰을 발급받아 1회 재시도한다(reactive recovery).
   * 짧은 수명 토큰(예: 스토어 범위 판매자 토큰)의 proactive 갱신을 보완하는 안전망.
   */
  reauth?: () => Promise<string>;
};

async function toApiError(response: Response): Promise<ApiError> {
  let code: string | null = null;
  let message = `요청에 실패했습니다 (${response.status})`;
  try {
    const data = (await response.json()) as { error?: unknown; message?: unknown };
    if (typeof data.error === "string") {
      code = data.error;
    }
    if (typeof data.message === "string") {
      message = data.message;
    }
  } catch {
    // 본문 없음/비 JSON → 기본 메시지 유지
  }
  return new ApiError(response.status, code, message);
}

/**
 * 게이트웨이를 향하는 단일 fetch 래퍼.
 * - baseUrl/쿼리 직렬화, JSON 직렬화, Authorization·Idempotency-Key 헤더 주입
 * - 실패 시 ApiError throw, 응답은 전달한 Zod 스키마로 경계 검증(§6.1)
 * - 204/빈 본문은 undefined 로 파싱(스키마는 z.void() 권장)
 */
export async function apiFetch<T>(
  path: string,
  schema: ZodType<T>,
  options: ApiFetchOptions = {},
): Promise<T> {
  const response = await apiFetchResponse(path, options);

  const text = await response.text();
  return schema.parse(text ? JSON.parse(text) : undefined);
}

/**
 * 인증·재발급·공통 오류 처리를 적용하되 Response body 소비는 호출자에게 맡긴다.
 * JSON이 아닌 스트리밍 응답처럼 `apiFetch`가 즉시 파싱할 수 없는 경계에서 사용한다.
 */
export async function apiFetchResponse(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const url = new URL(path, import.meta.env.VITE_API_BASE_URL);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (options.body !== undefined && !isFormData) {
    // FormData(멀티파트)는 브라우저가 boundary 포함 Content-Type 을 직접 설정하도록 둔다.
    headers["Content-Type"] = "application/json";
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }
  if (options.accept) {
    headers.Accept = options.accept;
  }
  const token = options.token ?? (options.auth === false ? null : accessTokenProvider());
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    ...(options.signal ? { signal: options.signal } : {}),
  };
  if (options.body !== undefined) {
    init.body = isFormData ? (options.body as FormData) : JSON.stringify(options.body);
  }
  let response = await fetch(url, init);

  // 짧은 수명 토큰: 401 이면 새 토큰으로 1회만 재시도(reactive). proactive 갱신이 놓친 만료/폐기 복구.
  if (response.status === 401 && options.reauth) {
    const freshToken = await options.reauth();
    response = await fetch(url, {
      ...init,
      headers: { ...headers, Authorization: `Bearer ${freshToken}` },
    });
  } else if (
    // 회원 access 토큰 만료: refresh 토큰으로 재발급 후 1회만 재시도(reactive).
    // 명시 토큰(override)·공개 호출·판매자 reauth 경로는 제외 — 회원 토큰 자동 주입 경로만 대상.
    response.status === 401 &&
    options.token === undefined &&
    options.auth !== false &&
    tokenRefreshHandler
  ) {
    const freshToken = await tokenRefreshHandler();
    if (freshToken) {
      response = await fetch(url, {
        ...init,
        headers: { ...headers, Authorization: `Bearer ${freshToken}` },
      });
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  return response;
}

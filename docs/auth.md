# openAt 인증·인가 (회원 · 판매자)

> FE 인증 모델의 단일 기준. BE 계약 표는 `be-api-contract.md`, 작업 절차·게이트는 `../AGENTS.md`.
>
> **원칙(멀티테넌트):** 인증은 전역, 인가는 스토어(테넌트) 범위. 회원 JWT 로 "누구"를, 스토어 범위 판매자 토큰으로 "어느 스토어로" 쓰는지를 가른다.

## 토큰 두 종류

| 토큰 | 발급 | 범위 | 보관 | 수명 | 용도 |
|---|---|---|---|---|---|
| 회원 JWT (`accessToken`) | 로그인/리프레시(`POST /members/login`·`/refresh`) | 회원 전역 | localStorage(persist) | 보통(예 1h) | 모든 보호 호출의 기본 인증 — `apiFetch` 가 자동 주입 |
| 판매자 JWT (`sellerToken`) | 발급(`POST /api/v1/seller/token`) | **스토어(sellerInfoId) 단위** | **메모리 only**(persist 제외) | **짧게** | 상품/드롭 write — 활성 스토어 전환 시 재발급 |

- 두 토큰은 **동시에** 보유한다(`authStore`). 회원 토큰은 새로고침 후에도 유지되고, **판매자 토큰은 새로고침/로그아웃 시 사라지며 다음 write 때 재발급**된다.
- 단명·스토어 범위 판매자 토큰을 메모리에만 두는 이유: XSS 표적(스토리지 탈취) 회피 권고. 회원 토큰·refreshToken 은 현재 localStorage(httpOnly 쿠키 전환은 별도 과제).

## 회원 인증 흐름

- 가입 `POST /api/v1/members` → 로그인 화면으로 유도(자동 로그인 안 함).
- 로그인 `POST /api/v1/members/login` → `TokenResponse` → `/me` 조회 → `authStore.setSession(token, member)`.
- 이후 모든 보호 호출은 `apiFetch` 가 `authStore.accessToken` 을 `Authorization: Bearer` 로 자동 주입한다(게터 주입은 `app/providers.tsx` 의 `setAccessTokenProvider`). 로그인 직후 `/me` 만 store 반영 전이라 `{ token }` override.
- 게이트웨이가 JWT 검증 후 `X-User-Id`/`X-User-Roles` 를 다운스트림에 주입한다.

## 판매자(스토어) 인증 흐름

회원은 스토어(판매자정보)를 **여러 개(1:N)** 가질 수 있다. 상품/드롭 write 는 **그 스토어 범위의 판매자 토큰**으로 인가된다.

### 1. 활성 스토어 — 단일 출처(SSOT)
- `features/seller/store/activeSellerStore.ts` 의 `activeSellerId` 가 "지금 어느 스토어로 동작 중인가"의 유일한 출처다.
- 헤더 전환기(`SellerSwitcher`), 콘솔 게이트(`SellerGuard` → `useActiveSellerInfo`), write 흐름이 모두 이 값을 본다.
- 해석 우선순위: `activeSellerId`(클라 선택) → 서버 `active` 플래그 → 첫 항목. id 만 영속하고 서버 active 플래그는 초기 시드.

### 2. 판매자 토큰 매니저 (`features/auth/api/auth.api.ts`)
짧은 수명 토큰을 안전하게 다루기 위한 3중 장치:
- **proactive** — `ensureSellerToken(sellerInfoId)`: 같은 스토어 토큰이 만료 스큐(15s) 밖이면 재사용, 아니면(스토어 변경·만료 임박·미보유) 재발급.
- **reactive** — write 가 `401` 이면 `apiFetch` 의 `reauth` 가 강제 재발급 후 **1회 재시도**(`resolveSellerAuth` 가 토큰+reauth 를 함께 제공).
- **single-flight** — 동시 재발급 요청은 하나의 in-flight 로 합쳐 race·중복 호출을 막는다.

### 3. 전환 = 재발급
- `switchActiveSeller(sellerInfoId)`: `activeSellerId` 즉시 갱신 → 이전 판매자 토큰 폐기 → 새 스토어 범위 토큰 **선재발급(proactive)**. 선재발급 실패는 삼키고 write 시점 안전망(ensure/reauth)이 재시도한다.

### 4. write 경로
- `resolveSellerAuth(sellerInfoId)` → `{ token, reauth }` → `createProduct`/`updateProduct`/`deleteProduct`·`createDrop` 가 `apiFetch` 에 실어 보낸다.

## 판매자 승격
- `POST /api/v1/seller/me`(USER 가능)로 판매자정보를 등록한다. **회원 JWT 의 `roles=SELLER` 반영은 refresh/재로그인 필요**(FE 안내). 이는 판매자 토큰과 별개다 — 승격 후 스토어가 생기면 그 스토어 범위로 판매자 토큰을 재발급한다.

## 계약 (BE)
- 회원/판매자정보 엔드포인트: `be-api-contract.md` §member·§seller 참조.
- 판매자 토큰 발급 — **BE 구현됨**(`SellerController.issueSellerToken`):
  ```
  POST /api/v1/seller/token             (회원 access 토큰 인증 · authenticatedAndNotScoped)
    body: { sellerInfoId }
    resp: { tokenType, accessToken, expiresIn }   ← 해당 스토어 범위 판매자 JWT
  ```
  ⚠️ 게이트웨이에 `/api/v1/auth/**` 라우트는 없다 — 과거 FE 가 쓰던 `POST /api/v1/auth/seller-token` 은 404(RouteExistenceFilter). MSW(`mocks/handlers/member.handlers.ts`)도 동일 경로로 맞춰 둠. `expiresIn` 을 BE 가 짧게 가져가도 FE 는 무탈하다(proactive 갱신 + 401 재시도가 흡수).

## 파일 맵
- 상태: `features/auth/store/authStore.ts`(회원·판매자 토큰), `features/seller/store/activeSellerStore.ts`(활성 스토어 SSOT)
- 토큰 매니저: `features/auth/api/auth.api.ts`(`ensureSellerToken`·`reissueSellerToken`·`resolveSellerAuth`)
- HTTP 경계: `shared/api/http.ts`(`apiFetch` 토큰 자동 주입 + `reauth` 401 재시도)
- 전환: `features/seller/api/sellers.queries.ts`(`switchActiveSeller`·`useActiveSellerInfo`), `features/seller/ui/SellerSwitcher.tsx`
- 목: `mocks/handlers/member.handlers.ts`

## 흐름 요약
```
로그인 → 회원 JWT(저장) ──auto──▶ 모든 보호 호출
스토어 선택(switchActiveSeller) → 판매자 토큰 선재발급(메모리)
write → resolveSellerAuth(ensure: proactive) → apiFetch(판매자 토큰)
          └ 401 → reauth(강제 재발급) → 1회 재시도
```

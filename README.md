<div align="center">

# openAt · Frontend

**한정판 드롭 커머스** — 에디토리얼 미니멀 화이트
별도 [Spring BE(MSA)](https://github.com/prgrms-be-adv-devcourse/beadv6_6_Let-sGPT_BE)의 API를 소비하는 **React 19 + Vite SPA** · 팀 Let'sGPT

<br/>

![TypeScript](https://img.shields.io/badge/TypeScript-strict-1C1A16?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-1C1A16?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-1C1A16?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-1C1A16?style=flat-square&logo=tailwindcss&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack-Router_Query-1C1A16?style=flat-square&logo=reactquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-1C1A16?style=flat-square)
![Zod](https://img.shields.io/badge/Zod-4-1C1A16?style=flat-square&logo=zod&logoColor=white)

![pnpm](https://img.shields.io/badge/pnpm-corepack-1C1A16?style=flat-square&logo=pnpm&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-lint_format-1C1A16?style=flat-square&logo=biome&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-unit-1C1A16?style=flat-square&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-e2e-1C1A16?style=flat-square&logo=playwright&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-10-1C1A16?style=flat-square&logo=storybook&logoColor=white)
![MSW](https://img.shields.io/badge/MSW-mocking-1C1A16?style=flat-square)
![status](https://img.shields.io/badge/screens-01--16_shipped-D6431F?style=flat-square)

[빠른 시작](#-빠른-시작) · [스택](#-스택) · [구현 화면](#-구현-화면) · [구조](#-구조) · [API 계약](#-api-계약) · [문서](#-문서)

</div>

---

> 사람은 스택·와이어프레임을 정의하고, 구현은 에이전트가 **검증 루프(타입 · 테스트 · 시각)** 를 돌며 수행한다.
>
> **현재 상태** — 와이어프레임 전 화면(01–16) 구현 + 디자인 확정 완료. 실 BE 연동 전까지 **MSW**로 전 플로우가 동작한다.

<br/>

## ⚡ 빠른 시작

> 이 머신엔 전역 `pnpm`이 없다. Node ≥22 동봉 **corepack**으로 구동한다(`corepack pnpm …`).

```bash
corepack pnpm install      # 의존성 설치 (+ git 훅 설치)
corepack pnpm dev          # 개발 서버 → http://localhost:5173
```

기본값(`.env`)은 `VITE_API_MOCKING=enabled` — **MSW가 네트워크를 가로채** 실 BE 없이 전 화면이 동작한다.

### 검증 루프

| 명령 | 역할 | 비고 |
|---|---|---|
| `corepack pnpm typecheck` | tsc strict | 성공 시 무출력 |
| `corepack pnpm lint` | Biome (lint + format 검사) | 자동 수정: `lint:fix` |
| `corepack pnpm test` | Vitest (단위/컴포넌트 + MSW) | watch: `test:watch` |
| `corepack pnpm build` | 타입체크 + 프로덕션 빌드 | CI 머지 게이트 |
| `corepack pnpm e2e` | Playwright | 최초 1회 `corepack pnpm exec playwright install` |
| `corepack pnpm storybook` | 컴포넌트 격리 검증 | `http://localhost:6006` |

<br/>

## 🧱 스택

```
TS(strict) · React 19 · Vite · Tailwind v4 · shadcn/ui · TanStack Router/Query
Zustand · Zod · Biome · Vitest · Playwright · MSW · Storybook
```

| 영역 | 선택 | 한 줄 근거 |
|---|---|---|
| 언어·런타임 | TypeScript(strict) · React 19 · Vite | 컴파일 타임에 실수를 잡는 가장 싼 검증 |
| 스타일 | Tailwind v4 · shadcn/ui · `cn()` | 시맨틱 토큰 단일 출처, 하드코드 색 금지 |
| 라우팅·서버 상태 | TanStack Router(파일 기반) · TanStack Query | 얇은 진입점 + `*.queries.ts`로 서버 상태 격리 |
| 클라 전역 상태 | Zustand | 서버 상태와 섞지 않음 |
| 경계 검증 | Zod | API 응답을 런타임에서 한 번 더 좁힘 |
| 품질·테스트 | Biome · Vitest · Playwright · Storybook | lint/format/단위/E2E/격리 검증 |
| 목킹 | MSW | 실 BE 연동 전 기본 검증 환경 |

> 선택 근거 전문은 [`docs/frontend-harness-guide.md`](./docs/frontend-harness-guide.md) §2.

<br/>

## 🖥 구현 화면

와이어프레임 전 화면(01–16)이 구현·디자인 확정되었다. 와이어프레임은 "무엇을 담을지"의 참고일 뿐, **실제 배치·동작·표기는 코드가 기준**이다.

<details>
<summary><b>고객(구매자) 화면 · 01–10</b></summary>

| # | 화면 | 라우트 | 도메인 |
|---|---|---|---|
| 01 | 홈 | `/` | — |
| 02 | 상품 목록 | `/products` | product |
| 03 | 상품 상세 | `/products/$id` | product |
| 04 | 드롭 목록 | `/drops` | product(drop) |
| 05 | 드롭 상세 | `/drops/$id` | product(drop) |
| 06 | 결제 | `/checkout/$orderId` | payment / order |
| 07 | 주문 완료 | `/orders/$orderId/complete` | order |
| 08 | 주문 목록 | `/orders` | order |
| 09 | 주문 상세 | `/orders/$orderId` | order |
| 10 | 마이페이지 | `/mypage` | member |

</details>

<details>
<summary><b>판매자/관리자 화면 · 11–16</b></summary>

| # | 화면 | 라우트 | 도메인 |
|---|---|---|---|
| 11 | 관리자 콘솔 | `/admin` | — |
| 12 | 상품 관리 | `/seller/products` (+ `/mypage` 탭) | product |
| 13 | 상품 관리 상세 | `/seller/products/$id` | product |
| 14 | 상품 등록 | `/seller/products/new` | product |
| 15 | 카테고리 관리 | `/admin/categories` | category |
| 16 | 정산 목록 | `/seller/settlements` · `/admin/settlements` | settlement |

</details>

> 화면별 와이어프레임(PNG)과 흐름은 [`screens/INDEX.md`](./screens/INDEX.md).

<br/>

## 🗂 구조

```
src/
  app/        앱 셸 — providers · queryClient · styles
  routes/     TanStack 파일 기반 라우트(얇은 진입점) → routeTree.gen.ts (자동생성, 수정 금지)
  features/   기능 단위 코로케이션 — <도메인>/{ model · api · queries · ui }
              auth · product · drop · category · order · payment · seller · settlement
  shared/     공통 — ui(shadcn + 공용 컨트롤) · lib · api(apiFetch · openapi-fetch client/schema)
  mocks/      MSW 핸들러(browser/server) + 목 데이터
  test/       Vitest 셋업
e2e/          Playwright 스펙
```

기능은 도메인 단위로 코로케이션하고, 공통 패턴은 `shared`로 추출해 전역이 함께 혜택받게 한다. 진입점(`routes/**`)은 얇게 유지한다.

<br/>

## 🔌 API 계약

런타임 경계는 [`shared/api/http.ts`](./src/shared/api/http.ts)의 **`apiFetch`** — Authorization · Idempotency-Key 자동 주입 + **Zod 검증**을 한곳에서 처리한다. BE 계약의 단일 기준 문서는 [`docs/be-api-contract.md`](./docs/be-api-contract.md).

게이트웨이 통합 스펙 `GET $VITE_API_BASE_URL/v3/api-docs/all`에서 타입을 코드젠한다.

```bash
corepack pnpm codegen      # → src/shared/api/schema.d.ts (자동생성, 수정 금지)
```

> 현재 `schema.d.ts`는 게이트웨이 미가동 상태에서도 컴파일되도록 최소 경로만 채운 **플레이스홀더**다. 미구현 BE 조회는 `// TODO(fe-api)` 마커 + MSW provisional로 운용하고, 게이트웨이를 띄운 뒤 코드젠을 1회 돌려 실제 스펙으로 교체한다([가이드](./docs/frontend-harness-guide.md) §6.1).

**자동생성 파일은 직접 수정하지 않는다** — `src/routeTree.gen.ts`(→ `routes:gen`) · `src/shared/api/schema.d.ts`(→ `codegen`).

<br/>

## 📚 문서

| 문서 | 내용 |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | 작전 지시서 — 에이전트/기여자 진입점(실행·절차·게이트) |
| [`docs/design-system.md`](./docs/design-system.md) | 디자인 지침 — 에디토리얼 미니멀 · 토큰 · 타이포 |
| [`docs/frontend-harness-guide.md`](./docs/frontend-harness-guide.md) | 설계 근거 — 하네스 엔지니어링 |
| [`docs/be-api-contract.md`](./docs/be-api-contract.md) | BE 계약 단일 기준 |
| [`docs/auth.md`](./docs/auth.md) | 인증 — 회원 JWT · 스토어 범위 판매자 토큰 |
| [`screens/INDEX.md`](./screens/INDEX.md) | 화면 와이어프레임 인덱스(참고용) |

<br/>

<div align="center">
<sub>프로그래머스 백엔드 단기심화 6기 2팀 <b>Let'sGPT</b> · 트렌드 리서치 → 에디토리얼 미니멀 테마로 수렴</sub>
</div>

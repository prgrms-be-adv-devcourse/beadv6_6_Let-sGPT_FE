# AGENTS.md — openAt FE 작전 지시서

별도 Spring BE(MSA)의 API 를 소비하는 React SPA(플랫폼 **openAt** · 팀 Let'sGPT). 구현은 검증 루프를 돌며 수행한다.
설계 근거는 `docs/frontend-harness-guide.md`, **디자인·UX 지침은 `docs/design-system.md`**, BE 계약은 `docs/be-api-contract.md`, **인증(회원·판매자) 방식은 `docs/auth.md`**, 화면 정의는 `screens/`.
프로젝트 배경·도메인·서비스 아키텍처가 필요하면 BE 레포 `docs/PROJECT.md`(`../beadv6_6_Let-sGPT_BE/docs/PROJECT.md`)를 참고한다 — 사본은 두지 않는다(동기화 드리프트 방지).

> **상태:** 와이어프레임 전 화면(01~16) 구현 + 디자인 확정 완료. 이후 작업은 기능 추가·수정·실 BE 연동이다. 미구현 BE 조회 API 는 provisional(MSW) + `// TODO(fe-api)` 마커로 운용한다(`product/docs/FE_API_REQUESTS.md` 인덱스).

## 0. 불명확하면 멈추고 질문하라
가정으로 진행하지 말 것. 요구·계약·화면이 모호하면 코드 생성 전에 질문한다.

## 1. 실행 명령 (⚠️ 전역 pnpm 없음 — 항상 `corepack pnpm`)
- 개발: `corepack pnpm dev` (http://localhost:5173). 목 데이터는 `.env` 의 `VITE_API_MOCKING=enabled`(현재 on).
- 빌드: `corepack pnpm build`  ·  미리보기: `corepack pnpm preview`
- 타입체크: `corepack pnpm typecheck`  ·  린트/포맷: `corepack pnpm lint` / `corepack pnpm lint:fix`
- 테스트: `corepack pnpm test` (watch: `test:watch`)  ·  E2E: `corepack pnpm e2e`  ·  스토리북: `corepack pnpm storybook`
- 라우트 트리 생성: `corepack pnpm routes:gen` (동적 라우트 추가 후. pre-commit 훅이 자동 실행)
- API 코드젠: `corepack pnpm codegen` (게이트웨이 가동 필요). `dev.yml`/`full.yml` 은 ghcr 사전빌드 이미지(인증 필요)라 평소엔 미사용 — **MSW 가 기본 검증 환경**.
- 스크린샷 검증: `corepack pnpm exec playwright screenshot --viewport-size=1440,1000 --wait-for-timeout=2500 <URL> out.png`. 인터랙션이 필요하면 루트에 임시 `.mjs`(`import { chromium } from "@playwright/test"`)→`node`→삭제. **모바일은 `--viewport-size=390,844` 로도 확인**한다.

## 2. 검증 순서와 우선순위 (작업 후 반드시)
1순위: **테스트 통과** — `corepack pnpm test`
2순위: **타입·린트 무위반** — `corepack pnpm typecheck` 그리고 `corepack pnpm lint`
3순위: 빠른 구현
- 시각 변경은 스크린샷으로 닫는다(데스크톱 + 모바일). 통과는 조용히, 실패는 시끄럽게.

## 3. 작업 절차 (변경 1개 = 커밋 1개, 애자일)
1. **계약·화면 확인**: `docs/be-api-contract.md`(부족하면 BE 코드 재확인) + 해당 `screens/NN-*`(참고).
2. **트렌드 리서치**: 추가·변경하는 화면/컴포넌트 유형의 최신 디자인을 웹 검색해 핵심 패턴 1~2개 추출 → **기존 테마(에디토리얼 미니멀 화이트)에 맞춰** 적용. 전면 재설계는 `/preview/*` 시안으로 먼저 제시 → 채택 후 본 라우트 반영 + 시안 정리.
3. **구현**: 시맨틱 토큰만(하드코드 색 금지). 공용 컨트롤·패턴(`docs/design-system.md` §4)을 먼저 재사용/확장. 구조 `src/features/<도메인>/{model(zod)·api·queries·ui}` + 공통 `src/shared/{ui,lib,api}`, 진입점(`routes/**`)은 얇게. 서버 상태 = TanStack Query(`*.queries.ts`), 클라 전역 = Zustand(섞지 않음). shadcn/ui 는 `src/shared/ui` 소유, 클래스 결합은 `cn()`.
4. **BE 연동**: 모든 호출은 `shared/api/http.ts` 의 `apiFetch`(Authorization·Idempotency-Key 자동 + Zod 경계 검증). 미구현 BE 는 `// TODO(fe-api)` + MSW provisional.
5. **MSW + 연동 테스트**: 피처별 통합 테스트(훅 + MSW + Zod). 목 데이터 `src/mocks/data/*`, 상태저장 흐름은 `mockDb`, 테스트 격리는 `resetMockDb`.
6. **검증 green 후 커밋**: §2 루프 통과 → `<type>(scope): <한국어 명사형>`(서명 금지).

## 4. 작업 기준 (품질 일관성 — 여러 FE 작업자 공통)
- **트렌드 → 테마**: 모든 추가·수정은 최신 트렌드 검색 후 기존 디자인/테마에 맞춰 구현(시각 기준은 `docs/design-system.md`).
- **공용 컨트롤 재사용**: 필터·드롭다운·상태·태그·모달·이미지는 기존 공용 컨트롤을 쓰고, 없으면 `shared/ui` 에 새로 추가해 전역이 함께 혜택받게 한다. 폐기된 컨트롤(`FilterChip`·`FilterSelect`·`DropStatusBadge`)은 재도입 금지.
- **반응형 필수**: 데스크톱·모바일 모두 동작/스크린샷 확인(특히 팝오버 정렬 잘림).
- **금액·합계 표기**: 숫자는 `tabular-nums`, 큰 합계는 `font-numeric`. 자리 흔들림 금지.

## 5. strict TypeScript 게이트 (관측된 실패 기반)
- `noUncheckedIndexedAccess`: 배열 인덱스·구조분해 결과는 `?? 기본값`·옵셔널 체이닝·`as const` 튜플로 좁힌다.
- `exactOptionalPropertyTypes`: 선택 prop 은 `...(x ? { x } : {})` 로 조건부 전개, 타입은 필요 시 `T | undefined` 명시.
- `verbatimModuleSyntax`: 타입 임포트는 `import type` / `import { type X }` 로 정확히.
- 인증: 보호 엔드포인트는 `apiFetch`(회원 토큰 자동). 로그인 직후 `/me` 만 `{ token }` override. **판매자 승격(`POST /seller/me`) 후 roles 갱신은 refresh/재로그인 필요**(FE 안내). 상품/드롭 write 는 **스토어 범위 판매자 토큰**(활성 스토어 전환 시 재발급·메모리 보관) — 상세 `docs/auth.md`.
- 이미지: 목 `thumbnailKey` = picsum URL → `ImagePlaceholder src=`. 실 BE 는 객체 키이므로 URL 변환 지점 필요.

## 6. 금지 / 승인 게이트
- ❌ 자동생성 파일 직접 수정 금지: `src/routeTree.gen.ts`(→ `routes:gen`), `src/shared/api/schema.d.ts`(→ `codegen`).
- ❌ 타입 약화(`any`, `@ts-ignore`, strict 완화) 금지 — 가장 싼 검증을 버리지 않는다.
- ❌ BE 레포는 **읽기 전용**. 예외: 필요한 API 는 `// TODO(fe-api): <METHOD> <경로> — <사유> [screens/NN]` 마커를 관련 `*ApiSpec.java` 에 남기고 `product/docs/FE_API_REQUESTS.md` 에 한 줄 인덱스. (그 외 BE 쓰기 금지)
- ⚠️ 의존성 대량 변경·메이저 업그레이드, 강제 푸시는 사용자 승인 후.

## 7. 라첏(The Ratchet)
이 문서의 모든 규칙은 실제 한 번의 실패에서 역추적된다. 추측성 규칙을 추가하지 말고, 관측된 실패만 규칙으로 승격한다.

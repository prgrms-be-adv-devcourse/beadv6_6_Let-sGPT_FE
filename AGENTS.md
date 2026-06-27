# AGENTS.md — openAt FE 작전 지시서

별도 Spring BE(MSA)의 API를 소비하는 React SPA(플랫폼 **openAt** · 팀 Let'sGPT). 구현은 에이전트가 검증 루프를 돌며 수행한다.
상세 배경/근거는 `docs/frontend-harness-guide.md`, **디자인 지침은 `docs/design-system.md`**, 화면 정의는 `screens/`.

## 0. 불명확하면 멈추고 질문하라
가정으로 진행하지 말 것. 요구·계약·화면이 모호하면 코드 생성 전에 질문한다.

## 1. 실행 명령 (⚠️ 전역 pnpm 없음 — 항상 `corepack pnpm`)
- 개발: `corepack pnpm dev` (http://localhost:5173)
- 빌드: `corepack pnpm build`  ·  미리보기: `corepack pnpm preview`
- 타입체크: `corepack pnpm typecheck`  ·  린트/포맷: `corepack pnpm lint` / `corepack pnpm lint:fix`
- 테스트: `corepack pnpm test` (watch: `test:watch`)  ·  E2E: `corepack pnpm e2e`
- 스토리북: `corepack pnpm storybook`
- 라우트 트리 생성: `corepack pnpm routes:gen`
- API 코드젠: `corepack pnpm codegen` (게이트웨이 가동 필요)

## 2. 검증 순서와 우선순위 (작업 후 반드시)
1순위: **테스트 통과** — `corepack pnpm test`
2순위: **타입·린트 무위반** — `corepack pnpm typecheck` 그리고 `corepack pnpm lint`
3순위: 빠른 구현
- 시각 변경은 스크린샷으로 닫는다(Playwright/Storybook). 통과는 조용히, 실패는 시끄럽게.

## 3. 컨벤션
- 패키지 매니저: pnpm(=corepack). 의존성 추가는 `corepack pnpm add`.
- 구조: 기능 단위 코로케이션. `src/features/<도메인>/{api,ui,model}`, 공통은 `src/shared/{ui,lib,api}`,
  진입점(`src/routes/**`, `src/main.tsx`, `app/providers`)은 얇게 유지.
- 상태: 서버 상태 = TanStack Query(`*.queries.ts`), 클라이언트 전역 = Zustand. 둘을 섞지 않는다.
- 경계: API 응답은 `src/shared/api/client.ts`로 호출하고 Zod 스키마로 런타임 검증(`model/*.schema.ts`).
- UI: shadcn/ui 컴포넌트는 `src/shared/ui`에 소유. 클래스 결합은 `cn()`.
- 디자인: 에디토리얼 미니멀 화이트. **시맨틱 토큰만 사용**(하드코드 색 금지). 상세 = `docs/design-system.md`.
- 와이어프레임(`screens/`)은 "무엇을 담을지"의 참고일 뿐 — 배치·형식은 디자인 시스템에 맞춰 재구성한다.
- 새 코드는 기존 시드(`features/drop`·`features/product`)의 결을 따른다.

## 4. 금지 / 승인 게이트
- ❌ 자동생성 파일 직접 수정 금지: `src/routeTree.gen.ts`(→ `routes:gen`), `src/shared/api/schema.d.ts`(→ `codegen`).
- ❌ 타입 약화(`any`, `@ts-ignore`, strict 완화) 금지 — 가장 싼 검증을 버리지 않는다.
- ❌ BE 레포는 **읽기 전용**. 예외: 필요한 API는 `// TODO(fe-api): <METHOD> <경로> — <사유> [screens/NN]` 마커를
  관련 `*ApiSpec.java`에 남기고 `product/docs/FE_API_REQUESTS.md`에 한 줄 인덱스. (그 외 BE 쓰기 금지)
- ⚠️ 의존성 대량 변경·메이저 업그레이드, 강제 푸시는 사용자 승인 후.

## 5. 라첏(The Ratchet)
이 문서의 모든 규칙은 실제 한 번의 실패에서 역추적된다. 추측성 규칙을 추가하지 말고,
관측된 실패만 규칙으로 승격한다.

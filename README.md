# Let'sGPT — Frontend

별도 Spring BE(MSA)의 API를 소비하는 **React 19 + Vite SPA**.
사람은 스택·와이어프레임을 정의하고, 구현은 에이전트가 검증 루프(타입·테스트·시각)를 돌며 수행한다.

- 작전 지시서(에이전트 진입점): [`AGENTS.md`](./AGENTS.md)
- 설계 근거(하네스 엔지니어링): [`docs/frontend-harness-guide.md`](./docs/frontend-harness-guide.md)
- 화면 와이어프레임: [`screens/INDEX.md`](./screens/INDEX.md)

## 빠른 시작

> 이 머신엔 전역 `pnpm` 이 없다. Node 동봉 **corepack** 으로 구동한다(`corepack pnpm ...`).

```bash
corepack pnpm install      # 의존성 설치 (+ git 훅 설치)
corepack pnpm dev          # 개발 서버 (http://localhost:5173)
```

검증 루프:

```bash
corepack pnpm typecheck    # tsc strict, 성공 시 무출력
corepack pnpm lint         # Biome (lint + format 검사)
corepack pnpm test         # Vitest (단위/컴포넌트 + MSW)
corepack pnpm build        # 타입체크 + 프로덕션 빌드
corepack pnpm e2e          # Playwright (브라우저 설치 필요: corepack pnpm exec playwright install)
corepack pnpm storybook    # 컴포넌트 격리 검증
```

## 스택

TS(strict) · React 19 · Vite · Tailwind v4 · shadcn/ui · TanStack Router/Query · Zustand · Zod ·
Biome · Vitest · Playwright · MSW · Storybook. (선택 근거는 가이드 §2)

## 구조

```
src/
  app/        앱 셸 — providers, queryClient, styles
  routes/     TanStack 파일 기반 라우트(얇은 진입점) → routeTree.gen.ts(자동생성, 수정 금지)
  features/   기능 단위 코로케이션 — <도메인>/{api,ui,model}  (시드: product)
  shared/     공통 — ui(shadcn) · lib · api(openapi-fetch client + 코드젠 schema)
  mocks/      MSW 핸들러(browser/server)
  test/       Vitest 셋업
e2e/          Playwright 스펙
```

## API 계약

게이트웨이 통합 스펙 `GET $VITE_API_BASE_URL/v3/api-docs/all` 에서 타입을 코드젠한다.

```bash
corepack pnpm codegen      # → src/shared/api/schema.d.ts (자동생성, 수정 금지)
```

> 현재 `schema.d.ts` 는 게이트웨이 미가동 상태에서 시드가 컴파일되도록 최소 경로만 채운 **플레이스홀더**다.
> 게이트웨이를 띄운 뒤 코드젠을 1회 돌려 실제 스펙으로 교체한다(가이드 §6.1).

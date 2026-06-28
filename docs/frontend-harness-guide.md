# 프론트엔드 하네스 엔지니어링 지침 (2026)

> **이 문서의 목적**
> 우리는 프론트엔드를 **별도 프로젝트**로 만들되, **사람은 기술 스택·와이어프레임만 정의하고 구현은 100% Claude Code(에이전트)가 수행**한다.
> 따라서 이 문서는 "예쁜 코드를 어떻게 짜는가"가 아니라 **"에이전트가 스스로 검증하며 올바른 코드를 만들어내도록, 프로젝트라는 환경(하네스)을 어떻게 설계하는가"** 를 다룬다.
> 스택 선택·구조·도구 하나하나를 **에이전트의 피드백 루프**라는 단일 기준으로 평가한다.

---

## 현재 상태 스냅샷 (FE 세션 진입점 — 2026-06-28)

> FE 세션이 **콜드스타트 없이** 바로 들어가도록, 지금까지 확정된 사실만 모았다. 세부 근거는 각 섹션 참조.

- **확정 스택**(§2): TS strict · React 19 + Vite SPA · pnpm · Tailwind v4 · shadcn/ui · TanStack Router/Query · Zustand · Zod · **Biome** · Vitest · Playwright(+MCP) · MSW · Storybook · (Sentry 후순위).
- **세션 모델**(이번 결정): **FE 주 세션 + `--add-dir ../beadv6_6_Let-sGPT_BE`**. BE는 **읽기 전용**, 단 `// TODO(fe-api)` 마커 경로만 쓰기 허용(§6.2). *일관성·git·검증 분리를 위해 한 세션으로의 병합은 배제.*
- **BE 계약 준비 완료**(§6.1): 게이트웨이가 5개 서비스(member·product·order·payment·settlement)를 **`http://localhost:8000/v3/api-docs/all`** 로 통합 노출, 전 경로 **`/api/v1/{도메인복수}`** 컨벤션. FE 코드젠 소스 = 이 엔드포인트 하나.
  - ⚠️ **미검증 체크포인트**: 게이트웨이 변경은 config-only라 런타임 미확인 → **첫 코드젠 직전** `/v3/api-docs/all`에 5개 서비스 `/api/v1/...` 경로가 다 잡히는지 1회 확인.
- **와이어프레임**: `screens/NN-name.png`(레이아웃) + `screens/INDEX.md`(라우트 매핑). 구현이 끝난 지금은 **코드가 동작·표기의 기준**이다.
- **구현 상태**(§9): 전 화면(01~16) 구현 + 디자인 확정 완료. 운영 규칙은 `AGENTS.md`(절차)·`docs/design-system.md`(디자인)·`docs/be-api-contract.md`(계약)로 분리. **다음: 실 BE 연동/코드젠.**
- **기록 정책**: product 결정 이력은 **사용자가 직접** `product/docs/DECISIONS.md`에 작성(에이전트는 쓰지 않음).

---

## 0. 핵심 전제 — "하네스가 모델보다 중요하다"

> *"A decent model with a great harness beats a great model with a bad harness."* — Addy Osmani

하네스 엔지니어링(Harness Engineering)은 모델을 더 좋게 만드는 일이 아니라, **에이전트가 일하는 환경·제약·피드백 루프를 설계**하는 일이다. 같은 모델이라도 하네스 품질에 따라 결과물 신뢰도가 크게 갈린다.

우리 프로젝트에 적용하면 원칙은 하나로 압축된다:

> **에이전트가 자신의 작업이 맞는지 스스로 확인(self-verify)할 수 있는 수단을 최대한 많이, 빠르고, 결정론적으로 제공한다.**

Anthropic에 따르면 **검증 수단을 주는 것만으로 결과 품질이 2~3배** 향상된다. 즉 스택과 구조의 1차 평가 기준은 "멋짐"이 아니라 **"에이전트가 결과를 얼마나 빠르고 확실하게 검증할 수 있는가"** 다.

---

## 1. 검증 루프 — 모든 설계의 중심

에이전트는 "코드 작성 → 검증 → 실패 시 자기수정"의 루프를 돈다. 검증 수단은 세 층위로 둔다(Anthropic 권장).

| 층위 | 수단 | 특징 | 우리 도구 |
|---|---|---|---|
| **규칙 기반** | 타입체크 · 린트 · 단위 테스트 | 결정론적, ms~s, 가장 싸다 | TypeScript(strict), Biome, Vitest |
| **시각 검증** | 스크린샷 · 헤드리스 브라우저 · 시각 회귀 | UI는 "보이는 것"이 정답 | Playwright(+MCP), Storybook |
| **LLM 심판** | 별도 서브에이전트가 결과를 평가 | 의미·UX 판단, 느림 | 리뷰 서브에이전트 / planner·evaluator 분리 |

### 1.1 "성공은 조용히, 실패는 시끄럽게" (Success is silent, failures are verbose)

검증 출력 설계의 황금률.

- **통과하면 출력이 없어야 한다.** 성공 로그로 컨텍스트를 낭비하면 에이전트가 본 작업을 잊고 엉뚱한 곳을 헤맨다.
- **실패하면 행동 가능한 에러 텍스트만** 루프에 주입한다. 에이전트는 그 에러를 보고 곧장 자기수정한다.
- 빌드·테스트·타입체크 스크립트는 이 원칙에 맞춰 **성공 시 silent, 실패 시 verbose** 하게 래핑한다.

### 1.2 피드포워드 + 피드백 (Martin Fowler)

- **피드포워드(예방)**: 애초에 틀리지 않게 하는 가이드 — 컨벤션 문서, 타입, 템플릿/스캐폴드, 언어 서버.
- **피드백(교정)**: 틀린 걸 잡아내는 센서 — pre-commit 훅, 테스트, 아키텍처 경계 검사, CI 게이트.
- 좋은 하네스는 **둘 다** 갖춘다: "처음부터 맞을 확률"을 높이고 + "틀려도 스스로 고치는" 루프를 준다.

---

## 2. 권장 기술 스택 (2026) — 선택 기준은 전부 "에이전트 친화성"

각 선택을 **하네스 관점의 근거**와 함께 제시한다. 이 표가 곧 다음 단계(스택 확정)의 추천안이다.

| 영역 | 권장 | 에이전트 친화 근거(Why) |
|---|---|---|
| **언어/타입** | **TypeScript (strict / strictest)** (확정) | 컴파일 타임 에러 = 에이전트에게 **가장 싸고 빠른 피드백**. 잘못된 상태를 런타임 전에 차단. |
| **프레임워크** | **React 19** + **Vite (Rolldown 기반)** SPA (확정) | React 19의 Actions·`use`·`useOptimistic` 등 표준 패턴이 풍부 → 에이전트가 학습한 관용구가 많다. Vite는 즉시 기동·초고속 빌드로 **루프 지연을 최소화**. (콘텐츠/SEO 중심이면 Next.js 검토) |
| **패키지 매니저** | **pnpm** | 빠르고 결정론적, 락파일로 **재현 가능한 환경** → 에이전트가 환경 드리프트와 싸우지 않는다. |
| **스타일** | **Tailwind CSS v4** (확정) | 스타일이 마크업에 **코로케이션** → 에이전트가 파일 하나로 의도 파악·수정. CSS-first 설정, 유틸리티 우선은 LLM과 궁합이 검증됨. |
| **컴포넌트** | **shadcn/ui** (확정) | **코드를 레포에 복사해 소유**(npm 블랙박스 아님) → 에이전트가 컴포넌트를 **직접 읽고 수정**. 버전 핀·깜짝 breaking change 없음. **가장 에이전트 친화적인 패턴.** |
| **라우팅** | **TanStack Router** (확정) | 라우트·params·search가 **end-to-end 타입드** → 라우팅 오류를 컴파일 타임에 포착. |
| **서버 상태** | **TanStack Query** (확정) | 캐싱·리페치·낙관적 업데이트를 표준화 → 에이전트가 수동 fetch 로직을 **재발명하지 않는다**. |
| **클라이언트 상태** | **Zustand** (확정) | 보일러플레이트 최소, 명시적 → 에이전트가 상태 흐름을 단순하게 추론. (전역 UI 상태에만 한정) |
| **경계 검증** | **Zod** (확정) | TS 타입은 런타임에 사라짐. API 응답 등 **신뢰 경계에서 런타임 검증** → 계약 위반을 즉시 노출. |
| **린트/포맷** | **Biome** (확정) | Rust 기반 올인원(린트+포맷+import 정리) — 1개 도구·1개 설정으로 하네스 단순화. 저장 시 자동 포맷으로 **공백 diff에 토큰 낭비 제거**. (Oxlint+Oxfmt가 더 빠르나 Oxfmt가 2026 베타라 보류) |
| **단위/컴포넌트 테스트** | **Vitest** | Vite 파이프라인 공유 → 가장 빠른 규칙 기반 피드백. |
| **E2E / 시각 검증** | **Playwright (+ MCP)** (확정) | 에이전트가 **실제 브라우저를 열어 자기가 만든 UI를 클릭·스크린샷·재시도**. 시각 회귀(픽셀 diff)로 의도치 않은 변화 포착. |
| **API 목킹** | **MSW (Mock Service Worker)** | BE 없이도 네트워크 경계 모킹 → 에이전트가 **독립적으로 검증 루프**를 돌린다. |
| **컴포넌트 격리/문서** | **Storybook** | 컴포넌트를 앱 흐름 없이 **고립 상태로 검증**. 변형(variants)별 시각 검증·회귀의 단위가 됨. |
| **에러 모니터링** | **Sentry** (선택) | 세션 리플레이로 런타임 문제의 **관측성** 확보. 초기엔 후순위. |

### 2.1 주요 분기점(권장 한 줄)

- **SPA(Vite) vs Next.js** → 우리는 별도 BE(Spring)가 API를 제공하는 **SPA 성격**이므로 **Vite + React SPA** 권장. (SSR/SEO가 핵심 요구로 들어오면 그때 Next.js 재검토)
- **린트/포맷 → Biome 확정** → 올인원(린트+포맷+import) 단일 도구·단일 설정으로 검증 루프가 단순. Oxlint+Oxfmt가 2~3배 빠르지만 Oxfmt가 2026 베타라 *안정·단순*을 택함(속도 차는 우리 규모에서 무의미).
- **상태관리** → 서버 상태는 무조건 **TanStack Query**, 클라이언트 전역 상태만 **Zustand**. "서버 상태 ≠ 클라이언트 상태" 원칙을 섞지 않는다.

---

## 3. 프로젝트 구조 — "예측 가능성"이 곧 성능

> AI는 인간의 직관·맥락을 공유하지 않는다. **예측 가능한 구조는 사람과 기계 모두의 탐색 공간을 줄이는 장치**다.

- **디렉터리 책임이 겹치지 않게** 한다. 책임이 모호하면 에이전트는 새 코드를 **엉뚱한 위치에 둔다**.
- **기능(feature) 단위 코로케이션**을 기본으로: 한 기능의 컴포넌트·훅·API·테스트·스토리를 가까이 둔다 → 에이전트의 컨텍스트 효율 ↑, 수술적(surgical) 변경 용이.
- **작고 단일 책임인 파일**: 큰 파일은 컨텍스트 낭비·광범위 diff를 유발. 작은 합성 단위로 쪼갠다.
- **명시성 > 마법**: 무거운 메타프로그래밍·과한 DI/추상화는 피한다. 에이전트는 **명시적 코드**에서 훨씬 잘 동작한다.
- **시드 예시(exemplar)를 심는다**: 에이전트는 기존 코드에서 패턴을 학습한다. "올바른 예시" 컴포넌트/훅/테스트를 한 벌 먼저 두면 이후 산출물이 그 결을 따른다.

---

## 4. `AGENTS.md` — 레포 루트의 작전 지시서

`AGENTS.md`는 2026년 사실상 표준(20,000+ 레포 채택, 2025-08 공식화). FE 레포 루트에 두고 **모든 에이전트 세션 프롬프트에 주입**된다.

### 설계 원칙
- **짧게(약 60줄 이하).** 스타일 가이드가 아니라 **조종사 체크리스트**다. 길면 토큰 낭비 + 중요한 줄이 묻힌다.
- **The Ratchet(래칫):** *"좋은 AGENTS.md의 모든 줄은 실제로 한 번 잘못된 일로 역추적 가능해야 한다."* 추측성 규칙 금지 — **관측된 실패만 규칙으로 승격**.
- **우선순위에 번호를 매긴다.** 충돌 시 명시적 순서가 없으면 에이전트는 검증을 건너뛰고 코드 생성으로 직행한다.
  예) `1순위: 테스트 통과 / 2순위: 타입·린트 무위반 / 3순위: 빠른 구현`.
- **상호작용 권장 문구를 넣는다.** 에이전트는 기본적으로 질문 없이 진행하는 경향(연구상 해결률 48.8%→28% 하락). "불명확하면 멈추고 질문하라"를 명시.

### 필수 포함 항목
- 실행 명령: `pnpm dev` / `pnpm build` / `pnpm test` / `pnpm typecheck` / `pnpm lint`
- 검증 순서(작업 후 반드시 돌릴 루프)와 통과 기준
- 컨벤션: 패키지 매니저, 디렉터리 규칙, 컴포넌트/상태 패턴, 금지 경로(예: 자동생성 파일 수정 금지)
- 파괴적 작업 승인 게이트(예: 의존성 대량 변경·강제 푸시 금지)

> 우리 BE의 `CLAUDE.md`가 작업 방식을, `docs/PROJECT.md`가 도메인을 나누어 담듯, FE도 **`AGENTS.md`(작전 지시) + `docs/`(상세 컨벤션/스택)** 로 분리한다.

---

## 5. 검증 인프라 셋업 체크리스트

스캐폴딩 시 아래를 **첫 커밋에** 갖춰 두면, 이후 모든 기능 작업이 자동으로 검증 루프를 탄다.

- [ ] **타입체크 스크립트** (`tsc --noEmit`) — strict 모드, 성공 silent / 실패 verbose
- [ ] **린트/포맷 on save + on commit** — Biome(린트 + 포맷 + import 정리), 포맷은 자동 적용
- [ ] **Vitest** 단위·컴포넌트 테스트 + watch
- [ ] **Playwright** E2E + **시각 회귀(스크린샷 baseline)** — 첫 실행 시 baseline 생성, 이후 픽셀 diff 게이트
- [ ] **Storybook** — 컴포넌트 변형별 격리 검증의 단위
- [ ] **MSW** — API 목킹으로 BE 독립 검증
- [ ] **pre-commit 훅** — 타입·린트·관련 테스트 실행(통과 못 하면 커밋 차단)
- [ ] **CI 게이트** — `typecheck + lint + test + 시각회귀`를 PR 머지 조건으로. **커버리지/검증을 약화하는 변경이 즉시 보이도록** 게이트를 둔다.
- [ ] **Playwright MCP** 연동 — 에이전트가 실제 Chromium을 띄워 자기 UI를 보고 고치게 한다("AI는 기본적으로 화면을 못 본다"는 한계를 MCP가 해소).

---

## 6. BE 계약 연동 — 타입을 경계 너머까지 잇는다

우리 FE는 별도 **Spring BE(MSA)의 API를 소비**한다. 계약(contract)은 BE→FE(타입)로, 요구는 FE→BE(쪽지)로 양방향으로 흐른다.

### 6.1 계약 흐름 (BE → FE)

- **단일 통합 스펙 소스**: 게이트웨이가 전 서비스 OpenAPI를 합쳐 **`GET /v3/api-docs/all`**(로컬 `http://localhost:8000`)로 노출한다. FE 코드젠은 이 **하나의 엔드포인트**만 본다 — 서비스별 스펙을 따로 긁지 않는다.
- **경로 컨벤션 `/api/v1/{도메인복수}`**: 전 서비스가 `/api/v1/members`·`/api/v1/products`·`/api/v1/orders`처럼 통일된 경로로 노출된다. 집계 스펙의 경로 = 게이트웨이 실제 경로라, 코드젠 결과를 **그대로 호출 가능**(prefix 보정 불필요).
- **OpenAPI → 타입 클라이언트 코드젠**: 위 스펙에서 **타입드 API 클라이언트를 자동 생성**(`openapi-typescript`/`orval`). → 계약이 바뀌면 **FE가 컴파일 에러**로 즉시 드러난다(에이전트가 가장 빨리 잡는 신호).
- **Zod로 런타임 경계 검증**: 코드젠 타입 + 응답 파싱 시 Zod 검증을 결합해, 스펙과 실제 응답의 괴리를 런타임에서도 노출.
- **MSW로 BE-독립 개발**: 스펙 기반 목 핸들러로 BE 없이도 에이전트가 전체 루프를 돈다.

### 6.2 요구 흐름 (FE → BE) — `// TODO(fe-api)`

FE 구현 중 **필요한데 아직 없는 API**를 만나면, FE 세션이 BE에 요청 마커를 남긴다.

- 마커 규칙(greppable): `// TODO(fe-api): GET /api/v1/products/{id}/related — 상세화면 연관상품 섹션에 필요 [screens/05-product-detail]`
- 두는 곳: 관련 `*ApiSpec.java` 인라인 + `product/docs/FE_API_REQUESTS.md` 한 줄 인덱스. BE는 `grep "TODO(fe-api)"`로 일괄 수거.
- 쓰기 권한은 **그 경로만** 허용한다(FE `.claude/settings.json`의 permissions). 나머지 BE는 읽기 전용 — TODO 기능에 필요한 만큼만 연다.

> 목적은 타입 안전이 아니라 **계약 드리프트·요구사항의 조기 노출**이다.
>
> **후속(미적용)**: 내부 API(`@InternalApi`, `/internal/**`)가 집계 스펙에 섞일 수 있다 → springdoc 그룹으로 `/internal/**`를 제외해 FE 계약을 정리한다.

---

## 7. 에이전트 작업 흐름 권장

- **계획 → 구현 → 검증 → 자기수정** 루프를 명시적으로 돌린다. 복잡한 작업은 **planner / generator / evaluator를 분리**(자기평가보다 별도 평가자가 더 객관적).
- **작은 단위로 자주 커밋·PR.** 광범위 변경은 검증·리뷰를 어렵게 한다.
- **시각 작업은 반드시 스크린샷으로 닫는다.** 렌더 변경 후 Playwright로 캡처 → 의도와 대조 → 시각 회귀로 부작용 차단.
- **장기 작업은 계획 파일 + 컨텍스트 리셋** 으로 운영(파일시스템을 외부 메모리로, 큰 로그는 디스크에 두고 필요 시 읽기).

---

## 8. 안티패턴 (하지 말 것)

- ❌ **검증 없는 스택 선택** — "유행해서" 고르지 않는다. 에이전트가 검증할 수 없는 도구는 부채다.
- ❌ **npm 블랙박스 UI 라이브러리에 깊게 결합** — 에이전트가 못 읽고 못 고친다(→ shadcn처럼 소유 가능한 코드 선호).
- ❌ **성공 로그를 verbose하게 방출** — 컨텍스트를 오염시켜 환각·이탈 유발.
- ❌ **거대한 AGENTS.md / 추측성 규칙** — 토큰 낭비, 신호 희석. 실패에서 역추적되는 규칙만.
- ❌ **타입 약화·런타임 의존** — 컴파일 피드백을 버리는 건 가장 싼 검증을 버리는 것.
- ❌ **디렉터리 책임 중복** — 에이전트가 코드를 엉뚱한 곳에 둔다.

---

## 9. 다음 단계

1~5단계(스택 확정 → 와이어프레임 → 스캐폴딩 + §5 검증 인프라 → 시드 예시 → 에이전트 검증 루프 구현)와 **전 화면(01~16) 구현 + 디자인 확정**은 완료됐다.

- 운영 규칙은 루트 `AGENTS.md`(작전 지시), 디자인은 `docs/design-system.md`, BE 계약은 `docs/be-api-contract.md` 로 분리·운용 중이다(본 문서는 설계 근거 보존용).
- 남은 것: **실 BE 연동/코드젠** — 게이트웨이 가동 → `pnpm codegen` 으로 `schema.d.ts` 실타입 교체 + provisional/`TODO(fe-api)` 정리. 신규 기능은 `AGENTS.md` §3 절차로.

---

## 출처

- [Agent Harness Engineering — Addy Osmani](https://addyosmani.com/blog/agent-harness-engineering/)
- [Harness engineering for coding agent users — Martin Fowler](https://martinfowler.com/articles/harness-engineering.html)
- [Agent Harness Engineering — O'Reilly Radar](https://www.oreilly.com/radar/agent-harness-engineering/)
- [Closing the verification loop: Observability-driven harnesses — Datadog](https://www.datadoghq.com/blog/ai/harness-first-agents/)
- [2026 Agentic Coding Trends Report — Anthropic](https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf)
- [AGENTS.md Patterns: What Actually Changes Agent Behavior](https://blakecrosley.com/blog/agents-md-patterns)
- [How to Build Your AGENTS.md (2026) — Augment Code](https://www.augmentcode.com/guides/how-to-build-agents-md)
- [On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents (arXiv)](https://arxiv.org/pdf/2601.20404)
- [A developer's guide to designing AI-ready frontend architecture — LogRocket](https://blog.logrocket.com/ai-ready-frontend-architecture-guide/)
- [Best Frontend Skills for AI Coding Agents (2026) — Agensi](https://www.agensi.io/learn/best-frontend-skills-ai-agents-2026)
- [Building shared coding guidelines for AI (and people too) — Stack Overflow](https://stackoverflow.blog/2026/03/26/coding-guidelines-for-ai-agents-and-people-too/)
- [My Frontend Stack In 2026 — The T-Shaped Dev](https://thetshaped.dev/p/my-frontend-stack-in-2026-react-nextjs-pnpm-vite-ts-tailwind-storybook-tanstack-zustand-zod-oxlint-oxfmt-msw-vitest-playright-sentry)
- [The React + AI Stack for 2026 — Builder.io](https://www.builder.io/blog/react-ai-stack-2026)
- [AI Is Blind: How Playwright MCP Revolutionizes Visual Testing](https://pasqualepillitteri.it/en/news/205/ai-blind-playwright-mcp-invisible-bugs)
- [Storybook vs Playwright: Component Testing 2026 — Autonoma](https://getautonoma.com/blog/storybook-vs-playwright-component-testing)

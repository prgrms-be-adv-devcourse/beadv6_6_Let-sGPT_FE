# openAt FE 전체 구현 — 진행 상태 & 이어가기 가이드

> **이 문서 목적**: 컨텍스트 리셋 후에도 동일한 품질·일관성으로 작업을 이어가기 위한 단일 진실원.
> 새 세션에서 "이어서 진행"을 받으면 **이 문서 → `docs/design-system.md` → `docs/be-api-contract.md` 순으로 읽고** 아래 "작업 절차"대로 다음 화면을 구현한다.

## 작업 절차 (화면 1개 = 커밋 1개, 애자일)
1. 다음 화면의 **BE 계약 확인**(`docs/be-api-contract.md`, 부족하면 BE 코드 재확인) + **와이어프레임**(`screens/NN-*.png`, 참고만).
2. 그 화면 유형의 **최신 트렌드 웹 검색**(예: "checkout page design 2026 minimal") → 핵심 패턴 1~2개 추출.
3. **설계·구현**: 에디토리얼 미니멀 화이트(`docs/design-system.md`) 유지. 시맨틱 토큰만, `CatalogLayout`/`ImagePlaceholder`/`FilterChip`/`Pagination`/shadcn(`button/card/input/label/form/sheet`) 재사용.
4. **BE 연동**: 모든 호출은 `shared/api/http.ts`의 `apiFetch`(Authorization·Idempotency-Key 자동). feature `model(zod)/api/queries` 구조. 미구현 BE는 `// TODO(fe-api)` + MSW provisional.
5. **MSW 핸들러 + 연동 테스트** 작성(피처별 통합 테스트: 훅+MSW+Zod). 목 데이터는 `src/mocks/data/*`, 상태저장 흐름은 `mockDb`.
6. **검증 루프 green 확인 후 커밋**: `corepack pnpm typecheck && pnpm lint && pnpm test && pnpm build`. 커밋 컨벤션 = `<type>(scope): <한국어 명사형>`(BE 동일, 서명 금지). 가능하면 `screens/NN-*.md` 매핑 문서도 갱신.
7. 다음 화면도 같은 절차(트렌드 재검색하되 기존 테마와 일관성 유지).

## 환경/명령 (중요)
- 전역 pnpm 없음 → **항상 `corepack pnpm ...`**.
- dev: `corepack pnpm dev`(:5173). 목 데이터 보려면 `.env`의 `VITE_API_MOCKING=enabled`(현재 enabled).
- 스크린샷 검증: `corepack pnpm exec playwright screenshot --viewport-size=1440,1000 --wait-for-timeout=2500 URL out.png` (chromium 설치됨). 인터랙션 필요 시 프로젝트 루트에 임시 `.mjs`(`import { chromium } from "@playwright/test"`) 작성→`node`→삭제.
- Docker 실(實)BE: `dev.yml`/`full.yml` 모두 ghcr 사전빌드 이미지(인증 필요)라 미사용. **MSW 기반 연동 테스트가 현재 표준.** 게이트웨이 가동 시 `corepack pnpm codegen`으로 `schema.d.ts` 실타입 교체 가능.

## 완료된 것
- **화면**: `/`(홈: 히어로+카운트다운+진행중 드롭), `/products`·`/drops`(카탈로그: 좌측 카테고리 고정 + 필터(정렬) 드로어 + 상태탭(드롭) + 검색 토글 + 페이지네이션), `/login`·`/signup`, `/products/$id`·`/drops/$id`(상세→구매), `/checkout/$orderId`(결제), `/orders/$orderId/complete`(완료), `/orders`·`/orders/$orderId`(주문 목록·상세), **`/mypage`(내정보·주문·지갑·환불이력·판매자 전환 — 좌측 탭 내비)**.
- **디자인 시스템**: `docs/design-system.md`(에디토리얼 미니멀 화이트 + 블루 X, 모노크롬 + `--live` 버밀리언, Pretendard + Instrument Serif). `scrollbar-gutter: stable`.
- **공용**: `shared/api/http.ts`(`apiFetch`), `pagination`, `shared/ui`(button/card/input/label/form/sheet/ImagePlaceholder/FilterChip/Pagination/CatalogLayout).
- **피처(model/api/queries)**: auth(member: signup/login/refresh/logout/me/update + `authStore`), product(목록/상세 API), drop(provisional 목록/상세), category(provisional), order(생성/조회/목록/취소), payment(결제/확인/환불/지갑충전/이력), seller(판매자정보 CRUD). queries 미작성 피처는 api 위에 훅만 추가하면 됨.
- **목**: `src/mocks/data/`(categories 6종, products 16종 **실이미지 thumbnailKey=picsum**, drops 10종, `mockDb` 상태저장) + `handlers/`(product/drop/category/member/seller/order/payment) — **주문→결제(WALLET 즉시/PG confirm)→완료→환불→지갑** 흐름이 목에서 일관 동작. 테스트 격리는 `resetMockDb`(setup afterEach).
- 검증: typecheck/lint/**test 22개**/build green.

## 남은 화면 (구현 순서 권장: 고객 플로우 → 판매자/관리자)
| # | 라우트(제안) | 핵심 BE | 메모 |
|---|---|---|---|
| ~~03 상품 상세~~ | `/products/$id` | `GET /api/v1/products/{id}` | ✅ 완료 |
| ~~05 드롭 상세~~ | `/drops/$id` | `GET /drops/{id}`(provisional) + `POST /orders` | ✅ 완료 |
| ~~06 결제~~ | `/checkout/$orderId` | `POST /payments`(WALLET/PG) (+`/payments/confirm`) | ✅ 완료 |
| ~~07 주문 완료~~ | `/orders/$orderId/complete` | `GET /orders/{id}` | ✅ 완료 |
| ~~08 주문 목록~~ | `/orders` | `GET /api/v1/orders?status&page&size` | ✅ 완료 |
| ~~09 주문 상세~~ | `/orders/$orderId` | `GET /orders/{id}` + `POST /orders/{id}/cancel` | ✅ 완료 |
| ~~10 마이페이지~~ | `/mypage` | `GET /members/me`·`PATCH`, `GET /wallet`·`/wallet/charge`, `/refunds/histories`, `GET/POST /seller/me` | ✅ 완료(좌측 탭: 내정보/주문/지갑/환불/판매자) |
| 14 상품 등록 | `/seller/products/new` | `POST /auth/token`(scoped)→`POST /api/v1/products` | **scoped 토큰 교환 흐름** 필요. `ProductCreateRequest` 필드 BE 재확인 |
| 12 상품 관리 | `/seller/products` | `GET /products?...`(내 sellerId 필터) | 판매자 콘솔 레이아웃 |
| 13 상품 관리 상세 | `/seller/products/$id` | `PATCH/DELETE /products/{id}` + `POST /drops` | 수정/삭제 + **드롭 생성**(productId, dropPrice, totalQuantity, limitPerUser?, openAt, closeAt?) |
| 15 카테고리 관리 | `/admin/categories` | `POST/PATCH/DELETE /categories` | 목록은 provisional `GET /categories` |
| 11 관리자 | `/admin` | (집계 — 정산/통계) | 대시보드 |
| 16 정산 | `/seller/settlements`·`/admin/settlements` | `GET /settlements/seller|admin/*` | 표/페이징, 정산월 필터, admin `retry-failed` |

## 핵심 주의(품질 유지 포인트)
- **strict/exactOptionalPropertyTypes**: 선택 객체 prop은 `...(x ? {x} : {})` 패턴, optional prop 타입은 필요시 `T | undefined` 명시. `verbatimModuleSyntax` → `import type` 정확히.
- **인증**: 보호 엔드포인트는 `apiFetch`(토큰 자동). 로그인 직후 `/me`는 `{ token }` override. 미구현 BE는 반드시 `// TODO(fe-api)`.
- **판매자 권한**: `POST /seller/me` 후 roles 갱신은 **refresh/재로그인 필요**(FE 안내). 상품 write는 scoped 토큰.
- **이미지**: 목 thumbnailKey = picsum URL → `ImagePlaceholder src=`. 실 BE는 키이므로 추후 URL 변환 지점 필요.
- **라우트**: 동적 라우트는 TanStack 파일기반 `$id`. 추가 후 `corepack pnpm routes:gen`(pre-commit 훅이 자동) + 헤더/내비 연결.
- 커밋은 **화면 단위로 작게**, 메시지 한국어 명사형, 서명 금지.

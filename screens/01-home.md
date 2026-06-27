# 01 · 홈 화면 (`01-home.png`)

> 한정판 드롭 커머스의 진입점. 오픈 예정 드롭을 알리고, 진행중 드롭을 카드로 노출한다.

## 목적
- 비로그인 방문자도 진행중/예정 드롭을 바로 탐색 → 상세/구매 흐름으로 유입.

## 구성 (와이어프레임 → 구현 매핑)
| 영역 | 구현 | 비고 |
|---|---|---|
| Header Menu (홈·드롭·전체 상품) | `app/layout/SiteHeader.tsx` | TanStack `Link` (`/`, `/drops`, `/products`) |
| 판매자 선택 드롭다운 | `SiteHeader` 내 `SellerSelect` | 비활성 플레이스홀더 — `TODO(fe-api)` 판매자 목록(member) |
| 내 정보 / 로그인·회원가입 | `SiteHeader` 우측 버튼 | 비로그인 상태 표시. 인증(member)은 후속 |
| 한정판 오픈 예정 배너 | `features/drop/ui/UpcomingDropBanner.tsx` | `useUpcomingDrops()` (status=REGISTERED) |
| 한정판(drop) 진행중 카드 목록 | `features/drop/ui/OngoingDropList.tsx` + `DropCard.tsx` | `useOngoingDrops()` (status=OPEN) |
| FOOTER | `app/layout/SiteFooter.tsx` | |

## 상태
- 서버 상태: TanStack Query(`drops/ongoing`, `drops/upcoming`). 클라이언트 상태 없음.
- 로딩/에러/빈 상태를 `OngoingDropList`에서 모두 처리 → BE 미가동이어도 화면이 깨지지 않음.

## 데이터 · 액션별 API
| 액션 | 메서드 · 경로 | 상태 |
|---|---|---|
| 진행중 드롭 목록 | `GET /api/v1/drops?status=OPEN` | ⚠️ **BE 미구현** — `TODO(fe-api)` (DropController 는 command 만) |
| 오픈 예정 드롭 목록 | `GET /api/v1/drops?status=REGISTERED` | ⚠️ **BE 미구현** — `TODO(fe-api)` |
| 판매자 목록(헤더 필터) | (member 도메인, 미정) | ⚠️ `TODO(fe-api)` |

> 응답 가정: `PageResponse<DropCardResponse>` — Drop(`dropPrice·totalQuantity·openAt·closeAt·status`)
> + 표시용 product(`productName·thumbnailKey`) + 재고 게이트키퍼의 `remainingQuantity`.
> 현재는 `src/mocks/handlers.ts` 의 MSW 목 + `drop.schema.ts` Zod 경계 검증으로 독립 구동.
> 게이트웨이에 조회 API가 생기면 `pnpm codegen` 후 `drops.api.ts` 의 fetch 를 typed `apiClient` 로 이관.

## 검증
- 단위/컴포넌트: `DropCard.test.tsx`(렌더·배지), `drops.queries.test.tsx`(상태 필터 + Zod, MSW).
- 시각: `DropCard.stories.tsx`(Ongoing/Upcoming/SoldOut). 페이지 E2E 는 후속.

## shadcn / 공통 컴포넌트
- `shared/ui/card`(DropCard), `shared/ui/button`(헤더). 상태 배지는 `DropStatusBadge`.
- 포맷: `shared/lib/format`(`formatKrw`·`formatDateTime`), 페이징: `shared/api/pagination`.

## 후속 / 미해결
- 드롭 조회 API 신설 요청을 BE 마커로 승격(`*DropApiSpec.java` + `product/docs/FE_API_REQUESTS.md`) — `.claude/settings.json` 승인 후.
- 인증 상태에 따른 헤더(내 정보 vs 로그인) 분기.
- 배너 다건/캐러셀, 카드 썸네일 이미지(현재 thumbnailKey 미사용).

# 01 · 홈 화면 (`01-home.png`)

> 한정판 드롭 커머스의 진입점. 오픈 예정 드롭을 카운트다운으로 강조하고, 진행중 드롭을 카드로 노출한다.
> 와이어프레임의 "배너" 2단 구성을 **에디토리얼 히어로 + 카드 그리드**로 전면 재배치(핵심 정보만 유지).

## 목적
- 비로그인 방문자도 진행중/예정 드롭을 바로 탐색 → 상세/구매 흐름으로 유입.

## 구성 (와이어프레임 → 구현 매핑)
| 영역 | 구현 | 비고 |
|---|---|---|
| Header (브랜드·Drops·Shop) | `app/layout/SiteHeader.tsx` | 스티키 + 백드롭 블러, 세리프 워드마크, 대문자 트래킹 내비 |
| 판매자 선택 | `SiteHeader` 내 `SellerSelect` | 비활성 플레이스홀더 — `TODO(fe-api)` 판매자 목록(member) |
| 로그인·회원가입 | `SiteHeader` 우측 버튼 | 비로그인 상태. 인증(member)은 후속 |
| 오픈 예정(히어로) | `features/drop/ui/HeroDrop.tsx` + `Countdown.tsx` | `useUpcomingDrops()` 최근접 1건 + 카운트다운 |
| 진행중 드롭 목록 | `features/drop/ui/OngoingDropList.tsx` + `DropCard.tsx` | `useOngoingDrops()`, 섹션 헤더 + 4col 그리드 |
| 드롭 카드 내부 | `DropImage`·`DropStatusBadge`·`StockBar` | 4:5 이미지 + 상태 태그(LIVE 점) + 재고 진행바 |
| FOOTER | `app/layout/SiteFooter.tsx` | 미니멀 에디토리얼 |

## 디자인 시스템 (에디토리얼 미니멀 화이트)
- 토큰: `app/styles/globals.css` — 웜 뉴트럴 모노크롬 + `--live`(버밀리언, 진행중/마감임박에만).
- 타이포: 디스플레이=Instrument Serif(브랜드·플레이스홀더 이니셜), 본문/한글=Pretendard. 숫자는 `tabular-nums`.
- 한글 헤드라인은 세리프 폴백이 없어 Pretendard로 렌더(모던 한국 커머스 관행) — 세리프는 라틴/이니셜 액센트로 한정.

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
- 단위/컴포넌트: `DropCard.test.tsx`(렌더·배지·재고), `drops.queries.test.tsx`(상태 필터 + Zod, MSW).
- 시각: `DropCard.stories.tsx`(Ongoing/Upcoming/SoldOut). 페이지 E2E·시각 회귀는 테마 확정 후.

## 공통 컴포넌트
- `shared/ui/button`(헤더·히어로 CTA). 포맷: `shared/lib/format`(`formatKrw`·`formatDateTime`), 페이징: `shared/api/pagination`.
- 드롭 전용 프레젠테이션: `DropCard`·`DropImage`·`DropStatusBadge`·`StockBar`·`Countdown`·`HeroDrop`.

## 후속 / 미해결
- 드롭 조회 API 신설 요청을 BE 마커로 승격(`*DropApiSpec.java` + `product/docs/FE_API_REQUESTS.md`) — `.claude/settings.json` 승인 후.
- 카드 썸네일 실제 이미지 연결(현재 `DropImage` 플레이스홀더), 상세 라우트(`/drops/:id`) 연결.
- 인증 상태에 따른 헤더(내 정보 vs 로그인) 분기, 모바일 내비(헤더 nav 가 sm 미만 숨김).

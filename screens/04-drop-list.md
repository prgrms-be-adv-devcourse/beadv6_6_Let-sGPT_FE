# 04 · 드롭 목록 (`04-drop-list.png`)

> 한정판 드롭을 상태·카테고리·검색·정렬로 탐색. 상품 목록과 동일한 공통 `CatalogLayout`:
> **상단 상태 탭 / 좌측 고정 카테고리 + 그 밑 필터(정렬) 버튼 / 우측 검색 버튼 / 하단 페이지네이션**.

## 구성 → 구현
| 영역 | 구현 |
|---|---|
| 상단 상태 탭 | `FilterChip` — 전체/진행중/오픈예정/마감/매진 |
| 좌측 카테고리(고정) | `CategorySidebar` — 상품과 공용 |
| 필터 버튼(카테고리 밑) | 우측 `Sheet` — **정렬**(추천순/오픈빠른순/가격) |
| 검색 버튼(우상단) | 인라인 키워드 검색창 |
| 드롭 그리드 | `DropCard` 2~4col(이미지·상태배지·재고바, **오픈 예정은 오픈 시각 표기**) + `Pagination`(8개/2행) |

- 서버 필터: `useDropList({ categoryId, status, keyword, sort, page, size })` → 한 번의 쿼리.
- 기본 정렬(추천순) = 자연 순서(진행중 → 예정 → 마감).

## 데이터 · API
| 액션 | 경로 | 상태 |
|---|---|---|
| 드롭 목록 | `GET /api/v1/drops?status&categoryId&keyword&sort&page&size` → `PageResponse<DropCardResponse>` | ⚠️ **BE 미구현** `TODO(fe-api)` (DropController 는 command 만) |

> `DropCardResponse` 는 표시·필터용으로 product 의 `categoryId/categoryName` 도 포함한다고 가정(provisional).
- 검증: `DropCard.test`(재고·오픈 시각·배지), `drops.queries.test`(상태 필터 + Zod, MSW).

## 후속
- 드롭 상세 라우트(`/drops/:id`) 연결.

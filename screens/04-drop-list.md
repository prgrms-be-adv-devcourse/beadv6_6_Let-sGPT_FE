# 04 · 드롭 목록 (`04-drop-list.png`)

> 한정판 드롭을 상태별로 탐색. 좌측 사이드바 대신 디자인 시스템에 맞춘 **상단 상태 탭**으로 재배치.

## 구성 → 구현
| 영역 | 구현 |
|---|---|
| 상태 탭 | `FilterChip` — 전체 / 진행중(OPEN) / 오픈 예정(REGISTERED) / 마감(CLOSE·SOLD_OUT) |
| 드롭 그리드 | `DropCard` 4col(이미지·상태배지·재고바) |

- 전체 드롭을 한 번 받아(`useDropList()`) 탭은 **클라이언트 필터**로 처리(마감 = CLOSE∪SOLD_OUT).

## 데이터 · API
| 액션 | 경로 | 상태 |
|---|---|---|
| 드롭 목록 | `GET /api/v1/drops?status&page&size` → `PageResponse<DropCardResponse>` | ⚠️ **BE 미구현** `TODO(fe-api)` (DropController 는 command 만) |

- 응답 가정/마이그레이션 정책은 `features/drop/api/drops.api.ts` 및 [`01-home.md`](./01-home.md) 참조.
- 검증: `DropCard.test`, `drops.queries.test`(상태 필터 + Zod, MSW).

## 후속
- 페이지네이션, 드롭 상세 라우트(`/drops/:id`) 연결.

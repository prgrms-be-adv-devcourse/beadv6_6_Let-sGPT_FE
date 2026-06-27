# 05 · 드롭 상세 (`/drops/$id`)

> 좌측 이미지 갤러리 / 우측 상태·가격·오픈·재고 + 상태별 주문 CTA. 구매 진입점.

## 구성 → 구현
| 영역 | 구현 |
|---|---|
| 이미지 갤러리 | `ImageGallery` + `buildGallery` |
| 드롭 정보 | 상태 배지·이름·`dropPrice`·오픈/종료 시각 · (REGISTERED)`Countdown` · (OPEN/SOLD_OUT)`StockBar` |
| 주문 CTA | OPEN=수량 스텝퍼 + "주문하기"(→ 주문 생성 → `/checkout/$orderId`) / REGISTERED="오픈 예정" / CLOSE="종료" / SOLD_OUT="매진" |

## 데이터 · API
| 액션 | 경로 | 상태 |
|---|---|---|
| 드롭 단건 | `GET /api/v1/drops/{id}` → `DropCardResponse` | ⚠️ **BE 미구현** `TODO(fe-api)`(provisional) |
| 주문 생성 | `POST /api/v1/orders` `{dropId, quantity, idempotencyKey}` → `CreateOrderResponse` | ✅ 실계약(인증) |

- 검증: `order-flow.test`(주문→WALLET 결제→COMPLETED 상태저장 MSW), 스크린샷.
- 후속: 1인 한도(`limitPerUser`)는 DropCardResponse 에 미포함 → BE 응답 확장 필요.

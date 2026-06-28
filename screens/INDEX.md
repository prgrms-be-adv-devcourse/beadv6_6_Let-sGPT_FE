# 화면 와이어프레임 인덱스 (screens/)

> 화면당 PNG 1장(레이아웃) — 위치·기능이 이미지에 주석으로 표기됨. 번호는 대략적 사용자 흐름 순서.
> **전 화면(01~16) 구현 + 디자인 확정 완료.** 와이어프레임은 "무엇을 담을지"의 참고일 뿐이고, 실제 배치·동작·표기는 **코드가 기준**이다(디자인은 `docs/design-system.md`, 절차는 `AGENTS.md`).

## 고객(구매자) 화면

| # | 파일 | 한글 화면명 | 구현 라우트 | 도메인 |
|---|---|---|---|---|
| 01 | `01-home.png` | 홈 화면 | `/` | - |
| 02 | `02-product-list.png` | 상품 목록 화면 | `/products` | product |
| 03 | `03-product-detail.png` | 상품 상세 화면 | `/products/$id` | product |
| 04 | `04-drop-list.png` | 드롭 목록 화면 | `/drops` | product(drop) |
| 05 | `05-drop-detail.png` | 드롭 상세 화면 | `/drops/$id` | product(drop) |
| 06 | `06-payment.png` | 결제 화면 | `/checkout/$orderId` | payment / order |
| 07 | `07-order-complete.png` | 주문 완료 화면 | `/orders/$orderId/complete` | order |
| 08 | `08-order-list.png` | 주문 목록 조회 | `/orders` | order |
| 09 | `09-order-detail.png` | 주문 상세 조회 화면 | `/orders/$orderId` | order |
| 10 | `10-mypage.png` | 마이페이지 화면 | `/mypage` | member |

## 판매자/관리자 화면

| # | 파일 | 한글 화면명 | 구현 라우트 | 도메인 |
|---|---|---|---|---|
| 11 | `11-admin.png` | 관리자페이지 화면 | `/admin` | - |
| 12 | `12-product-manage.png` | 상품 관리 화면 | `/seller/products` (+ `/mypage` 탭) | product |
| 13 | `13-product-manage-detail.png` | 상품 관리 상세 화면 | `/seller/products/$id` | product |
| 14 | `14-product-create.png` | 상품 등록 화면 | `/seller/products/new` | product |
| 15 | `15-category-manage.png` | 카테고리 관리 화면 | `/admin/categories` | category |
| 16 | `16-settlement-list.png` | 정산 목록 조회 | `/seller/settlements` · `/admin/settlements` | settlement |

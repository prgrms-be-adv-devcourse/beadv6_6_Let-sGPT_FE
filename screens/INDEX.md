# 화면 와이어프레임 인덱스 (screens/)

> 화면당 PNG 1장(레이아웃) — 위치·기능이 이미지에 주석으로 표기됨.
> 구현 시 각 PNG 옆에 같은 이름의 **`NN-name.md`**(목적·상태·데이터·검증·액션별 API·shadcn 컴포넌트 매핑)를 만들어 짝지운다.
> 번호는 대략적 사용자 흐름 순서, 영문 슬러그는 코드·문서 참조용, 한글명은 원본(카카오톡 와이어프레임) 기준.

## 고객(구매자) 화면

| # | 파일 | 한글 화면명 | 관련 도메인 |
|---|---|---|---|
| 01 | `01-home.png` | 홈 화면 | - |
| 02 | `02-product-list.png` | 상품 목록 화면 | product |
| 03 | `03-product-detail.png` | 상품 상세 화면 | product |
| 04 | `04-drop-list.png` | 드롭 목록 화면 | product(drop) |
| 05 | `05-drop-detail.png` | 드롭 상세 화면 | product(drop) |
| 06 | `06-payment.png` | 결제 화면 | payment / order |
| 07 | `07-order-complete.png` | 주문 완료 화면 | order |
| 08 | `08-order-list.png` | 주문 목록 조회 | order |
| 09 | `09-order-detail.png` | 주문 상세 조회 화면 | order |
| 10 | `10-mypage.png` | 마이페이지 화면 | member |

## 판매자/관리자 화면

| # | 파일 | 한글 화면명 | 관련 도메인 |
|---|---|---|---|
| 11 | `11-admin.png` | 관리자페이지 화면 | - |
| 12 | `12-product-manage.png` | 상품 관리 화면 | product |
| 13 | `13-product-manage-detail.png` | 상품 관리 상세 화면 | product |
| 14 | `14-product-create.png` | 상품 등록 화면 | product |
| 15 | `15-category-manage.png` | 카테고리 관리 화면 | category |
| 16 | `16-settlement-list.png` | 정산 목록 조회 | settlement |

> 번호·영역 구분·도메인 매핑은 파일명에서 추정한 **제안**이다. 실제 흐름/소속이 다르면 이 표와 파일명을 조정한다.

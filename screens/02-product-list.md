# 02 · 상품 목록 (`02-product-list.png`)

> 전체 상품을 카테고리·키워드로 탐색. 와이어프레임의 좌측 카테고리 사이드바 + 우측 필터 구성은
> 디자인 시스템에 맞춰 **상단 필터 바(카테고리 칩 + 검색)** 로 재배치(반응형·미니멀).

## 구성 → 구현
| 영역 | 구현 |
|---|---|
| 카테고리 필터 | `FilterChip` 행 — `useCategories()` (전체 + 카테고리들) |
| 키워드 검색 | `Input type="search"` — `keyword` 상태 |
| 상품 그리드 | `ProductCard` 4col — `useProductList({ categoryId, keyword })` |
| 개수/상태 | `totalElements` 표시 + 로딩/에러/빈 상태 |

## 데이터 · API
| 액션 | 경로 | 상태 |
|---|---|---|
| 상품 검색 | `GET /api/v1/products?categoryId&keyword&page&size` → `PageResponse<ProductResponse>` | ✅ 실계약(apiClient + Zod) |
| 카테고리 목록 | `GET /api/v1/categories` → `Category[]` | ⚠️ **BE 미구현** `TODO(fe-api)` (CategoryController 는 command 만) |

- `ProductResponse`: `price` nullable(가격 미정), `thumbnailKey` nullable(이미지 없음 → `ImagePlaceholder`).
- 검증: `ProductCard.test`(카테고리·가격·가격미정), `products.queries.test`(키워드 필터 + Zod), `product.schema.test`.

## 후속
- 페이지네이션/무한스크롤(현재 단일 페이지), 키워드 디바운스, 상품 상세 라우트(`/products/:id`) 연결.
- 카테고리 조회 API 신설 요청을 BE 마커로 승격.

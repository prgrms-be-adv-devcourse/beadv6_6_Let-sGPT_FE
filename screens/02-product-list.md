# 02 · 상품 목록 (`02-product-list.png`)

> 전체 상품을 카테고리·검색·정렬로 탐색. 공통 `CatalogLayout`:
> **좌측 고정 카테고리 + 그 밑 필터(정렬) 버튼 / 우측 검색 버튼 / 하단 페이지네이션**.

## 구성 → 구현
| 영역 | 구현 |
|---|---|
| 좌측 카테고리(고정·sticky) | `CategorySidebar` — `useCategories()`. lg 미만에선 필터 드로어 안에 노출 |
| 필터 버튼(카테고리 밑) | 우측 `Sheet` 드로어 — **정렬**(최신순/가격) |
| 검색 버튼(우상단) | 누르면 인라인 키워드 검색창 |
| 상품 그리드 | `ProductCard` 2~4col — `useProductList({ categoryId, keyword, sort, page, size })` |
| 페이지네이션 | `Pagination` — 페이지당 8개(2행), `totalPages` 기반 |

## 데이터 · API
| 액션 | 경로 | 상태 |
|---|---|---|
| 상품 검색 | `GET /api/v1/products?categoryId&keyword&sort&page&size` → `PageResponse<ProductResponse>` | ✅ 실계약(apiClient + Zod). `sort` = Pageable 형식("createdAt,desc") |
| 카테고리 목록 | `GET /api/v1/categories` → `Category[]` | ⚠️ **BE 미구현** `TODO(fe-api)` (CategoryController 는 command 만) |

- `ProductResponse`: `price` nullable(가격 미정), `thumbnailKey` nullable → `ImagePlaceholder`.
- 검증: `ProductCard.test`, `products.queries.test`(키워드 필터 + Zod), `product.schema.test`.

## 후속
- 키워드 디바운스, 상품 상세 라우트(`/products/:id`) 연결, 카테고리 조회 API 신설 요청을 BE 마커로 승격.

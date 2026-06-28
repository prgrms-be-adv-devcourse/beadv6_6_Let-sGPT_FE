# openAt BE API 계약 (FE 통합 레퍼런스)

> 게이트웨이 `http://localhost:8000`. 코드젠 전까지 이 문서가 통합 기준이다(게이트웨이 가동 후 `pnpm codegen` 으로 대체).
> 표기: `UUID/Instant/LocalDateTime → string`, `long/int → number`. 인증 = 게이트웨이가 JWT 검증 후 `X-User-Id`/`X-User-Roles` 주입 → FE 는 `Authorization: Bearer` 로 토큰 전달(회원 토큰 기본, 판매자 write 는 스토어 범위 판매자 토큰 — §인증·권한).

## 인증·권한
- 토큰: member 가 RS256 JWT 발급(`accessToken`/`refreshToken`). roles 클레임 = `USER`/`SELLER`/`ADMIN` 중 **현재 1개**.
- 판매자 승격: `POST /api/v1/seller/me`(USER 가능) → 이후 **refresh/재로그인 해야 roles=SELLER 토큰** 획득.
- 상품/드롭 write(판매자)는 **스토어 범위 판매자 토큰** 필요(회원 JWT 와 별도, `sellerInfoId` 단위). FE 주도 계약(BE 미구현, `TODO(fe-api)` 예정): `POST /api/v1/auth/seller-token {sellerInfoId} → {tokenType, accessToken, expiresIn}`(회원 JWT 인증, 짧은 수명). 활성 스토어 전환 시 재발급 — 상세 `auth.md`.
- 쓰기(주문/결제/환불/충전)는 **`Idempotency-Key` 헤더**(주문은 body `idempotencyKey`) 필수.

## member (회원/인증)
| M·P | 경로 | 요청 | 응답 | 인증 |
|---|---|---|---|---|
| POST | `/api/v1/members` | `{email, password(8~64), nickname(≤30)}` | `MemberResponse` 201 | - |
| POST | `/api/v1/members/login` | `{email, password}` | `TokenResponse` | - |
| POST | `/api/v1/members/refresh` | `{refreshToken}` | `TokenResponse` | - |
| GET | `/api/v1/members/me` | - | `MemberResponse` | ✓ |
| PATCH | `/api/v1/members/me` | `{password?, nickname?}` | `MemberResponse` | ✓ |
| POST | `/api/v1/members/logout` | - | 204 | ✓ |
| DELETE | `/api/v1/members/me` | - | 204(탈퇴) | ✓ |

- `MemberResponse{ id, email, nickname, role: ROLE_USER|ROLE_SELLER|ROLE_ADMIN, platformType: LOCAL|KAKAO|GOOGLE|NAVER }`
- `TokenResponse{ tokenType:"Bearer", accessToken, refreshToken, expiresIn:number }`

## seller (판매자정보, member 모듈)
| M·P | 경로 | 요청 | 응답 | 인증 |
|---|---|---|---|---|
| GET | `/api/v1/seller/me?isActive=false` | - | `SellerInfoResponse[]` | SELLER |
| POST | `/api/v1/seller/me` | `{businessNumber(≤30), storeName(≤50)}` | `SellerInfoResponse` 201 | USER+ |
| PATCH | `/api/v1/seller/me/{sellerId}` | `{storeName(≤50)}` | `SellerInfoResponse` | SELLER |
| DELETE | `/api/v1/seller/me/{sellerId}` | - | 204 | SELLER |
| GET | `/api/v1/seller/{userId}` | - | `SellerInfoResponse[]` | ADMIN |

- `SellerInfoResponse{ id, businessNumber, storeName, active:boolean }` (회원 1:N 판매자정보)

## product (상품)
| M·P | 경로 | 요청 | 응답 | 인증 |
|---|---|---|---|---|
| GET | `/api/v1/products?categoryId&keyword&page&size&sort` | - | `PageResponse<ProductResponse>` | - |
| GET | `/api/v1/products/{id}` | - | `ProductResponse` | - |
| POST | `/api/v1/products` | `ProductCreateRequest` | 201+Location | **판매자토큰** |
| PATCH | `/api/v1/products/{id}` | `ProductUpdateRequest` | 204 | **판매자토큰** |
| DELETE | `/api/v1/products/{id}` | - | 204(오픈 드롭 있으면 `DROP_OPEN_EXISTS`) | **판매자토큰** |
| GET | `/api/v1/products/me?categoryId&keyword&page&size&sort` | - | `PageResponse<ProductResponse>`(본인 스토어) | **판매자(인증)** |
| POST | `/api/v1/products/images` | 멀티파트 `file` | `{ key, url }` | **인증** |
| GET | `/api/v1/products/images/{key}` | - | 이미지 바이트(스트리밍) | - |

- `ProductResponse{ id, sellerId(=sellerInfoId), sellerName:null, name, description, categoryId:null, categoryName:null, price:null(number), thumbnailKey:null, imageKeys:string[], createdAt }`
- `ProductCreateRequest`/`ProductUpdateRequest`: `name, description?, categoryId?, price?, thumbnailKey?, imageKeys?`.
- **판매자명 ✅**: `sellerName` 응답 포함(미연동 시 null) — 카드·상세 벤더 표기.
- **이미지 ✅**: 대표 `thumbnailKey` + 갤러리 `imageKeys`. 업로드 `POST /products/images`(멀티파트 `file`→`{key,url}`), 조회 `GET /products/images/{key}`. FE 는 키를 `{base}/api/v1/products/images/{key}` 로 렌더(`resolveImageSrc`). 세미=로컬 저장 · 파이널=S3.
- **본인 상품 목록 ✅**: `GET /products/me`(활성 스토어 기준).

## drop (드롭)
| M·P | 경로 | 요청 | 응답 | 인증 |
|---|---|---|---|---|
| POST | `/api/v1/drops` | `{productId, dropPrice, totalQuantity, limitPerUser?, openAt, closeAt?}` | 201+Location | **판매자토큰** |
| DELETE | `/api/v1/drops/{dropId}` | - | 204 | **판매자토큰** |
| GET | `/api/v1/drops?status&categoryId&keyword&sort&page&size` | - | `PageResponse<DropResponse>` | - |
| GET | `/api/v1/drops/{dropId}` | - | `DropResponse` | - |
| GET | `/api/v1/drops/me?status&categoryId&keyword&sort&page&size` | - | `PageResponse<DropResponse>`(본인 스토어) | **판매자(인증)** |

- `DropResponse{ id, productId, productName, sellerName:null, categoryId:null, categoryName:null, thumbnailKey:null, dropPrice, totalQuantity, remainingQuantity, status, openAt, closeAt:null }` — 검색/상세/본인 조회 3종 구현 ✅. `sellerName` 포함(미연동 시 null). 드롭엔 `imageKeys` 없음(단일 썸네일).
- 드롭 상태 파생: DB 엔 `REGISTERED/CLOSE`만, `OPEN/SOLD_OUT` 은 시각+재고로 런타임 파생. 1인 한도 `limitPerUser`(null=무제한).

## category (카테고리, product 모듈)
| M·P | 경로 | 요청 | 응답 | 인증 |
|---|---|---|---|---|
| POST | `/api/v1/categories` | `CategoryCreateRequest{name,...}` | 201 | ADMIN? |
| PATCH | `/api/v1/categories/{id}` | `{name}` | 204 | |
| DELETE | `/api/v1/categories/{id}` | - | 204(products.category SET NULL) | |
| ⚠️ GET 목록 | (없음) | — | — | **`TODO(fe-api)`** |

- 조회 API 미구현 → provisional. 시드: 의류/액세서리/문구/전자기기/피규어/기타(6종).

## order (주문)
| M·P | 경로 | 요청 | 응답 | 인증 |
|---|---|---|---|---|
| POST | `/api/v1/orders` | `{dropId, quantity(≥1), idempotencyKey}` | `CreateOrderResponse` 201 | ✓ |
| GET | `/api/v1/orders/{orderId}` | - | `OrderResponse` | ✓ |
| GET | `/api/v1/orders?status&page&size` | - | `PageResponse<OrderSummaryResponse>` | ✓ |
| POST | `/api/v1/orders/{orderId}/cancel` | - | `OrderCancelResponse` | ✓ |

- `CreateOrderResponse{ orderId, orderNumber, status, amount:number, orderName, paymentExpiresAt }` (status 항상 `PAYMENT_PENDING`)
- `OrderResponse{ orderId, orderNumber, dropId, productId, productName, quantity, totalPrice, status, paymentId:null, paymentExpiresAt, failCode:null, createdAt }`
- `OrderSummaryResponse` = OrderResponse 에서 paymentId/paymentExpiresAt/failCode 제외
- `OrderStatus`: `PAYMENT_PENDING|COMPLETED|FAILED|CANCELLED|CANCEL_REQUESTED|REFUND_PENDING|REFUNDED|REFUND_FAILED`
- `OrderFailCode`: `SOLD_OUT|DROP_NOT_OPEN|DROP_CLOSED|LIMIT_EXCEEDED|PAYMENT_FAILED|PAYMENT_EXPIRED|PAYMENT_STATUS_CHECK_FAILED|PG_ERROR|PRODUCT_INTEGRATION_FAILED|STOCK_ROLLBACK_FAILED`
- 흐름: 주문 생성 → (PG) 브라우저 토스 SDK → `/payments` → `/payments/confirm`. 취소: PENDING→즉시 CANCELLED / COMPLETED→CANCEL_REQUESTED(비동기 환불).

## payment (결제/환불/지갑)
| M·P | 경로 | 요청 | 응답 | 인증 |
|---|---|---|---|---|
| POST | `/api/v1/payments` | `{orderId, amount, method:WALLET\|PG}` +IdemKey | `PaymentResponse` 201 | ✓ |
| POST | `/api/v1/payments/confirm` | `{orderId, amount, paymentKey}` +IdemKey | `PaymentResponse` | ✓ |
| GET | `/api/v1/payments/{id}` | - | `PaymentResponse` | - |
| POST | `/api/v1/refunds` | `{paymentId, amount, reason}` +IdemKey | `RefundResponse` 201 | ✓ |
| GET | `/api/v1/refunds/{id}` | - | `RefundResponse` | - |
| GET | `/api/v1/refunds/histories?page&size` | - | `RefundHistoryResponse` | ✓ |
| POST | `/api/v1/wallet/charge` | `{amount, method:MOCK\|PG}` +IdemKey | `WalletChargeResponse` 201 | ✓ |
| POST | `/api/v1/wallet/charge/confirm` | `{chargeId, amount, paymentKey}` +IdemKey | `WalletChargeResponse` | ✓ |
| ⚠️ 지갑 잔액 조회 | (없음) | — | — | **`TODO(fe-api)`** |

- `PaymentResponse{ paymentId, status(string), paymentKey:null }` — WALLET→`APPROVED`, PG 생성→`PAYMENT_PENDING`, confirm→`APPROVED`/`FAILED`
- `RefundResponse{ refundId, paymentId, amount, status: COMPLETE|FAILED|PENDING }`
- `RefundHistoryResponse{ content: RefundResponse[], totalPages }` (page/size 기본 0/20)
- `WalletChargeResponse{ chargeId, status: PENDING|APPROVED|FAILED }`
- WALLET 결제: 즉시 승인(잔액부족 `409 INSUFFICIENT_BALANCE`). PG: 생성(PENDING)→토스 SDK→confirm. 환불 초과 `409 EXCEED_REFUNDABLE_AMOUNT`.

## settlement (정산)
| M·P | 경로 | 응답 | 인증 |
|---|---|---|---|
| GET | `/api/v1/settlements/seller/orders?settlementMonth&status&sellerId&orderId&page&size` | `PageResponse<SettlementOrderSummary>` | SELLER |
| GET | `/api/v1/settlements/seller/sellers?settlementMonth&sellerId&status&page&size` | `PageResponse<SellerSettlementSummary>` | SELLER |
| GET | `/api/v1/settlements/admin/orders` (동일 파라미터) | `PageResponse<SettlementOrderSummary>` | ADMIN |
| GET | `/api/v1/settlements/admin/sellers` | `PageResponse<SellerSettlementSummary>` | ADMIN |
| GET | `/api/v1/settlements/admin/batch-results?settlementMonth&status&page&size` | `PageResponse<SettlementBatchResultSummary>` | ADMIN |
| POST | `/api/v1/settlements/admin/retry-failed?settlementMonth` | `RetryFailedSellerSettlementsResponse` | ADMIN |

- `SettlementOrderSummary{ id, sellerSettlementId, paymentId, orderId, sellerId, buyerId, productId, settlementMonth(yyyyMM), orderAmount, paidAmount, feeAmount, refundAmount, netSettlementAmount, status: READY|COMPLETED, paidAt }`
- `SellerSettlementSummary{ id, batchId, settlementMonth, sellerId, totalOrderCount, totalPaidAmount, totalFeeAmount, totalRefundAmount, totalAdjustmentAmount, finalSettlementAmount, status: READY|COMPLETED|FAILED, completedAt, failReason, failedAt }`
- `SettlementBatchResultSummary{ batchId, settlementMonth, batchType: LOAD_PAYMENT|LOAD_REFUND|SETTLEMENT_RUN|SETTLEMENT_RETRY, status: READY|RUNNING|COMPLETED|FAILED, startedAt, endedAt, totalOrderCount, totalSellerCount, totalSettlementAmount, failReason, createdAt }`
- 정산식: `netSettlement = paidAmount - feeAmount - refundAmount`. 월 1일 03:00 배치(전월).

## FE 통합 메모
- 모든 인증 호출은 `shared/api/http.ts`의 `apiFetch`(Authorization 자동 주입 + Idempotency-Key + Zod 경계 검증).
- 미구현 BE(`// TODO(fe-api)` + MSW provisional): **드롭 조회**(목록·상세), **카테고리 조회**, **지갑 잔액**, **판매자 본인 상품/드롭 목록**, **판매자명**(product·drop 응답의 storeName/sellerName), **상품 갤러리/이미지 업로드**. 인덱스 = `product/docs/FE_API_REQUESTS.md`.
- PG 결제는 실제 토스 SDK 대신 FE 에선 **모의 결제(MSW)** 로 confirm 흐름만 재현.

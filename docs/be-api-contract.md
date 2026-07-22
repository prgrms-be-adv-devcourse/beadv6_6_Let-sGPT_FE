# openAt BE API 계약 (FE 통합 레퍼런스)

> 게이트웨이 `http://localhost:8000`. 코드젠 전까지 이 문서가 통합 기준이다(게이트웨이 가동 후 `pnpm codegen` 으로 대체).
> 표기: `UUID/Instant/LocalDateTime → string`, `long/int → number`. 인증 = 게이트웨이가 JWT 검증 후 `X-User-Id`/`X-User-Roles` 주입 → FE 는 `Authorization: Bearer` 로 토큰 전달(회원 토큰 기본, 판매자 write 는 스토어 범위 판매자 토큰 — §인증·권한).

## 인증·권한
- 토큰: member 가 RS256 JWT 발급(`accessToken`/`refreshToken`). roles 클레임 = `USER`/`SELLER`/`ADMIN` 중 **현재 1개**.
- 판매자 승격: `POST /api/v1/seller/me`(USER 가능) → 이후 **refresh/재로그인 해야 roles=SELLER 토큰** 획득.
- 상품/드롭 write(판매자)는 **스토어 범위 판매자 토큰** 필요(회원 JWT 와 별도, `sellerInfoId` 단위). **BE 구현됨**: `POST /api/v1/seller/token {sellerInfoId} → {tokenType, accessToken, expiresIn}`(회원 access 토큰 인증, 짧은 수명). 활성 스토어 전환 시 재발급 — 상세 `auth.md`. (⚠️ 게이트웨이에 `/api/v1/auth/**` 없음 — 옛 경로 `auth/seller-token` 은 404)
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
| GET | `/api/v1/products/me?categoryId&keyword&page&size&sort` | - | `PageResponse<ProductResponse>`(본인 스토어) | **판매자토큰**(⚠️ GET이지만 BE가 X-Seller-Id로 스토어 식별 → 회원 토큰이면 401) |
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
| GET | `/api/v1/drops/me?status&categoryId&keyword&sort&page&size` | - | `PageResponse<DropResponse>`(본인 스토어) | **판매자토큰**(⚠️ products/me 와 동일 — X-Seller-Id 필요, 회원 토큰이면 401) |

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
| POST | `/api/v1/orders` | `{dropId, quantity(≥1), idempotencyKey, orderName}` | `CreateOrderResponse` 201 | ✓ |
| GET | `/api/v1/orders/{orderId}` | - | `OrderResponse` | ✓ |
| GET | `/api/v1/orders?status&page&size` | - | `PageResponse<OrderSummaryResponse>` | ✓ |
| POST | `/api/v1/orders/{orderId}/cancel` | - | `OrderCancelResponse` | ✓ |

- `CreateOrderResponse{ orderId, orderNumber, status, amount:number, orderName, paymentExpiresAt, created:boolean }` (status 항상 `PAYMENT_PENDING`)
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
| GET | `/api/v1/wallet` | - | `{ balance:number }`(지갑 없으면 0) | ✓ |

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

## ai (관리자 AI 어시스턴트)
| M·P | 경로 | 요청 | 응답 | 인증 |
|---|---|---|---|---|
| GET | `/api/v1/ai/chats/capabilities` | - | `ChatCapabilitiesResponse` | ADMIN |
| POST | `/api/v1/ai/chats` | `{message}` + `Accept: text/event-stream` | SSE | ADMIN |

- `ChatCapabilitiesResponse{ prototype, maxMessageLength, notice, capabilities:Capability[] }`
- `Capability{ type, label, description, availability:ACTIVE|PLANNED|UNAVAILABLE, sampleQuestions:string[] }`
- 초기 POST 요청은 저장하지 않는 단일 질문이며, 앞선 질문의 문맥을 다음 요청에 자동으로 전달하지 않는다.
- named SSE 이벤트는 `status | message | delta | done | error`다. heartbeat comment(`: ...`)는 데이터 이벤트가 아니므로 무시한다.
  - `status`: `{ stage:ROUTING|PLANNING|QUERYING|RETRIEVING|CALLING_TOOL|GENERATING, route?:ChatRoute|null }`
  - `message`: `{ text }` — 스트리밍 없이 완성된 안내
  - `delta`: `{ text }` — 생성 답변 조각
  - `done`: `{ route }` — 정상 완료의 유일한 종료 이벤트
  - `error`: `{ code, message, retryable, partial }`
- 생성은 애플리케이션의 170초 deadline을 넘으면 `CHAT_TIMEOUT` 오류로 끝난다. 앞서 `delta`를 받았다면 `partial:true`이며 `done`은 오지 않는다.
- POST와 Authorization 헤더가 필요하므로 네이티브 `EventSource` 대신 fetch `ReadableStream`과 `AbortController`를 사용한다.

## FE 통합 메모
- JSON 인증 호출은 `shared/api/http.ts`의 `apiFetch`, SSE는 같은 인증·401 복구 경계를 적용하는 `apiFetchResponse`를 사용한다.
- BE 엔드포인트 현황(2026-06-29 BE 코드 대조 완료): 드롭 조회(목록·상세·`/me`)·카테고리 조회·판매자 본인 상품/드롭 목록(`products/me`·`drops/me`)·이미지 업로드·판매자 토큰(`/seller/token`)·지갑 잔액 **전부 BE 구현 확인**. 과거 "미구현" 표기는 모두 낡았던 것(원인은 대개 FE 경로 오타 또는 게이트웨이 라우트 오인).
- 유일한 잔여 갭은 **판매자명(sellerName)** — 엔드포인트·DTO 필드는 있으나 BE 가 store명 이벤트 전파 전엔 `null` 가능(로컬은 시드로 채움). FE 는 `sellerName` 을 nullish 로 이미 처리하므로 추가 작업 없음. 인덱스 = `product/docs/FE_API_REQUESTS.md`.
- **상품 이미지 업로드/조회는 BE 구현 완료**(`POST /products/images` multipart→`{key,url}`, `GET /products/images/{key}`). 업로드는 `/products/**` 라 **판매자 스토어 범위 토큰** 필요(회원 토큰이면 게이트웨이 401/403) → `uploadProductImage`가 `SellerAuth` 부착.
- PG 결제는 실제 토스 SDK 대신 FE 에선 **모의 결제(MSW)** 로 confirm 흐름만 재현.

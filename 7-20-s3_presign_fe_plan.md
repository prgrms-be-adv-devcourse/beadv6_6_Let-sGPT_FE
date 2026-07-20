# [FE 플랜] 상품 이미지 S3 presigned 전환 연동 (2026-07-20)

> 근거 문서: BE 레포 `personal_workplan/change_requests/7-16-product_s3_change_request.md`
> BE 전환 요지: 업로드 = presign PUT(staging 직행) / 저장 시 promote(copy-before-save) / 조회 = presigned GET URL(만료 15분, 5분 시간버킷 메모이즈) 응답 포함.

---

## 0. 현행 FE 구조 (영향 지점)

| 파일 | 현행 역할 |
|---|---|
| `src/features/product/api/products.api.ts` | `uploadProductImage` — multipart `POST /api/v1/products/images` → `{key, url}` |
| `src/features/product/model/product.schema.ts` | `imageUploadSchema {key,url}`, write body `thumbnailKey`/`imageKeys` |
| `src/features/product/ui/ProductImageField.tsx` | 파일 선택 → multipart 업로드 → key 보관/썸네일 선택 |
| `src/shared/lib/image.ts` | `resolveImageSrc` — key → `GET /api/v1/products/images/{key}` 조립. 풀 URL(https/blob/data)은 패스스루 |
| `src/shared/ui/ImagePlaceholder.tsx` | src 렌더(에러 처리 훅 없음) |
| `src/mocks/handlers/product.handlers.ts` | MSW 목 |

---

## Phase 1 — presign 업로드 플로우 (핵심)

### 1-1. API 클라이언트 (`products.api.ts` + `product.schema.ts`)

```
presignProductImage({filename, contentType}, auth: SellerAuth)
  → POST /api/v1/products/images/presign
  → { stagingKey, uploadUrl, expiresAt }   (zod: presignedUploadSchema 신규)

uploadToS3(uploadUrl, file)
  → 순수 fetch(uploadUrl, { method:'PUT', headers:{'Content-Type': file.type}, body:file })
  → apiFetch 미사용(외부 오리진·토큰 없음·JSON 아님). 200 외 응답은 throw.
```

- 헤더는 **Content-Type 하나만** — presign 서명 대상이 key+contentType이므로 추가 헤더 넣으면 403.
- 기존 `uploadProductImage`(multipart)는 BE deprecated 존치 기간 동안 함수만 남기고 호출부에서 제거 → BE 제거 시 같이 삭제.

### 1-2. `ProductImageField.tsx` 업로드 파이프라인 교체

```
파일 n개 선택
  → (a) 클라이언트 사전검증: 크기 상한(Q1 확정치, 잠정 5MB)·타입 화이트리스트(Q2, 잠정 jpeg/png/webp)
        — UX용 사전차단일 뿐, 진짜 게이트는 BE HeadObject
  → (b) 파일별 병렬: presign → S3 PUT   (Q3: 다중 이미지도 파일당 presign 1회)
  → (c) stagingKey 를 images/thumbnail 상태로 보관 → 상품 write 시 thumbnailKey/imageKeys 로 전송
```

**미리보기 함정**: stagingKey 는 promote 전이라 **GET URL이 없다** →
업로드 직후 미리보기는 `URL.createObjectURL(file)` blob URL로. 상태를
`{ key: stagingKey, previewSrc: blobUrl }` 맵으로 들고, `resolveImageSrc`는 blob: 패스스루라 렌더 무수정.
언마운트/제거 시 `revokeObjectURL` 정리.

**수정(edit) 화면 혼재**: 기존 이미지 = final key(또는 presigned URL), 신규 = stagingKey+blob.
write body 에는 둘 다 key 문자열만 — BE가 staging/ prefix 로 신규 여부 판별(promote 대상 식별)한다는 전제. → BE 확인 필요(열린 질문 ①).

### 1-3. 에러 UX

- presign 403/401: 판매자 토큰 문제 → 기존 reauth 경로 재사용.
- S3 PUT 실패(만료 10분 초과 등): "업로드 실패, 다시 시도" — presign부터 재시작.
- 상품 저장 400 `IMAGE_INVALID`: 크기/타입 서버 게이트 탈락 메시지 노출.

## Phase 2 — 조회 렌더링

- BE 조회 응답이 presigned GET **풀 URL** 을 주면 `resolveImageSrc` 는 이미 패스스루 → **무수정 동작**.
- 과도기(구 key 응답)도 기존 key→`/products/images/{key}` 폴백이 커버 → 전환기 안전.
- 확인 필요(열린 질문 ②): URL이 기존 `thumbnailKey` 필드에 실리는지, 별도 `thumbnailUrl`/`imageUrls` 필드인지(BE Q5). 별도 필드면 `product.schema.ts` + 렌더 지점(ProductCard, drops/$id, products/$id, buildGallery 호출부) 필드 스위치.
- presigned URL은 5분 창마다 바뀜 → React key 로 URL 쓰지 말 것(현재 key 문자열 사용 중이라 문제 없음, 유지).

## Phase 3 — 403 재조회 안전판 (BE 문서 Q7 계약)

- `ImagePlaceholder` 에 `onLoadError` 콜백 추가 → 상품 이미지 렌더 지점에서 react-query `invalidateQueries(상품 상세/목록)` 1회 호출(무한루프 방지: 이미지당 재시도 1회 가드).
- 만료 presigned URL 403 → 상품 재조회 → 새 URL 수신 → 재렌더.

## Phase 4 — 목/테스트

- `src/mocks/handlers/product.handlers.ts`: `POST /api/v1/products/images/presign` 핸들러 + S3 staging PUT 목(`http.put('https://*.s3.*.amazonaws.com/*')` 수준 와일드카드) 추가. 조회 목 응답을 presigned풍 풀 URL로 갱신.
- 갱신 대상 테스트: `product-image.test.ts`(presign+PUT 플로우로 재작성), `ProductImageField` 상호작용, `seller-product-flow.test.tsx`(e2e 목 플로우), `product.schema.test.ts`(신규 스키마).
- e2e(playwright): 판매자 상품 등록 시나리오가 이미지 업로드를 타면 MSW/목 서버 경로 갱신.

## CORS 제약 (2026-07-20 보완)

- staging 버킷 CORS PUT 허용은 terraform 기배선(`terraform/images.tf:98`). 단 허용 origin = `https://openat.duckdns.org` 단일(`variables.tf:145`).
- ⇒ 로컬 dev(localhost:5173)에서 **실 S3 상대 수동 PUT은 CORS 실패**. 개발은 MSW 목(Phase 4)으로 진행하고, **실환경 검증은 배포된 FE에서만 가능**. localhost origin 추가는 인프라 트랙 별도 판단.

## 착수 가능 범위 (2026-07-20 기준)

- 지금 가능: Phase 4(목/테스트) + Phase 2(조회 패스스루 확인) + Phase 1의 API 계층(presign 클라이언트·schema — MSW 상대 개발).
- 잠김: Phase 1 UI 컷오버(ProductImageField 교체 머지) — BE presign 엔드포인트 미구현 + 질문 ③(상한/화이트리스트) 미확정.

## 전환 순서(롤아웃)

1. BE presign 엔드포인트 + 조회 URL 응답 배포 확인.
2. FE Phase 2(조회) 먼저 머지 — 무수정~저위험, 구/신 응답 겸용.
3. FE Phase 1+3+4 한 PR — 업로드 컷오버. multipart 폴백 코드는 남겨두되 미사용.
4. BE multipart 제거 공지 후 폴백 삭제.

## BE에 확인할 열린 질문

| # | 질문 | 대응 BE 항목 |
|---|---|---|
| ① | write body 의 stagingKey vs final key 혼재 판별 방식(staging/ prefix?) — 수정 화면에서 기존 final key 재전송 시 promote 스킵 보장? | §6, Q3 |
| ② | 조회 응답에서 presigned URL 필드 위치(기존 thumbnailKey 대체? 별도 필드?) | Q5 |
| ③ | 크기 상한 확정치·타입 화이트리스트(FE 사전검증 동기화) | Q1/Q2 |
| ④ | presign 엔드포인트 게이트웨이 경로·판매자 scoped 토큰 요구 여부(기존 /products/** 규칙 동일?) | §5-1 |
| ⑤ | 403 재조회 안전판 계약 확정(FE가 이 플랜 Phase 3로 이행) | Q7 |

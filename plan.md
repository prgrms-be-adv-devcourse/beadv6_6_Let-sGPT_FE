# 결제·충전 멱등키 설계 및 구현 상태

## 멱등키 라이프사이클

### 결제 (PG / WALLET)

| 단계 | 함수 | sessionStorage 키 | 설명 |
|---|---|---|---|
| 결제 버튼 클릭 | `getOrCreatePaymentKey(orderId)` | `idem:pay:{orderId}` 생성 | 동일 orderId 재클릭 시 기존 키 재사용 |
| PG: Toss 리다이렉트 후 confirm | `getOrCreatePaymentKey(orderId)` | `idem:pay:{orderId}` 재사용 | 리다이렉트 후에도 sessionStorage 유지 |
| 성공/실패 | `clearPaymentKey(orderId)` | `idem:pay:{orderId}` 삭제 | 이후 동일 orderId 재시도 시 새 키 발급 |
| WALLET: 즉시 완료 | 별도 clear 없음 | 키 잔류 | orderId 단위 주문은 재결제 불가(`alreadyPaid` 가드)이므로 무해 |

### 지갑 충전 (MOCK / PG)

| 단계 | 함수 | sessionStorage 키 | 설명 |
|---|---|---|---|
| 충전 버튼 클릭 | `getOrCreatePendingChargeKey()` | `idem:charge:pending` 생성 | 연속 클릭 보호 |
| **MOCK 완료** | `clearPendingChargeKey()` | `idem:charge:pending` 삭제 | 다음 충전은 새 키 발급 |
| **MOCK 실패** | `clearPendingChargeKey()` | `idem:charge:pending` 삭제 | 재시도 시 새 키 |
| PG: chargeId 확정 | `persistChargeKey(chargeId)` | pending 삭제 → `idem:charge:{chargeId}` 생성 | 슬롯 이전 |
| PG: confirm 성공/실패 | `clearChargeKey(chargeId)` | `idem:charge:{chargeId}` 삭제 | |

---

## 원자성 한계 및 장애 시나리오

네트워크 호출(mutateAsync)과 sessionStorage 조작(clearKey)은 원자적으로 묶을 수 없다.
현재 구현은 **"confirm 성공 후 clear"** 순서를 유지한다.

### 시나리오 A — confirm 성공 후 clear 전에 브라우저 종료

```
mutateAsync → APPROVED  ✓
clearKey            ← 브라우저 종료, 미실행
```

- 키가 sessionStorage에 잔류
- 같은 탭에서 재접속하면 기존 키로 재시도
- 백엔드: 동일 키 → 캐시된 APPROVED 반환 (멱등 처리)
- **결과: 안전** (이중 처리 없음)

### 시나리오 B — clear 후 confirm 실패 (현재 구현에서는 발생하지 않음)

```
clearKey  ← 만약 먼저 실행했다면
mutateAsync → 실패
재시도 → 새 키 발급 → 이중 confirm 가능
```

- 이 순서는 채택하지 않음
- **현재 구현: clear는 반드시 mutateAsync 완료 후 실행**

### 시나리오 C — MOCK 충전: confirm 성공 후 clear 전 종료 (수정 전 버그)

```
mutateAsync → APPROVED  ✓
clearPendingChargeKey   ← 미실행 (수정 전: 아예 없었음)
```

- 이후 재충전 시 동일 키 재사용
- 백엔드 409 Conflict 반환
- 새로고침·로그아웃 후에도 sessionStorage 유지로 동일 증상 반복
- **수정: 성공/실패 양쪽에서 clearPendingChargeKey() 호출**

---

## 한계 (프론트 레벨에서 해결 불가)

- confirm + clear의 완전한 원자성: 백엔드에서 키 만료 시그널을 응답에 포함하거나 서버 사이드 세션으로 관리해야 함
- sessionStorage는 탭 단위 유지 → 로그아웃해도 키 잔류. 로그아웃 시 sessionStorage 전체 clear를 원하면 auth 흐름에 추가 필요

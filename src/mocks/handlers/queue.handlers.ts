import { HttpResponse, http } from "msw";

import { type MockQueueEntry, mockDb } from "../data/mockDb";

/**
 * BE 에는 정적 hot-drops 목록이 없다 — 모든 dropId 가 대기열을 거친다(경쟁이 없으면 BE 가
 * 즉시 READY 를 돌려주는 fast path 가 있어, 실제로는 대부분의 주문에서 대기 UI 가 안 보인다).
 * 이 목은 그 fast path 대신 항상 "약간의 대기 후 admit" 시퀀스를 결정적으로 재현해 WAITING/
 * DECISION_REQUIRED/READY 상태머신 전체를 데모/테스트에서 확인할 수 있게 한다.
 */
const POLL_INTERVAL_MS = 1200;

/** BE `queue.decision.timeout-ms` 기본값(30초)과 동일하게 맞춘 목의 무응답 이탈 처리 창. */
const DECISION_TIMEOUT_MS = 30_000;

/**
 * 실제 BE(재고 인지형 admit.lua/outstanding 회계)를 그대로 흉내내지 않는다 — 목의 목적은
 * "폴링할 때마다 상태가 결정적으로 전진해 UI 상태머신(WAITING→[DECISION_REQUIRED]→READY)을
 * 전부 보여주는 것"뿐이다. 수량 구간별로 서로 다른 결정 시나리오를 재현한다:
 * - 1~2개: 결정 없이 곧장 READY.
 * - 3~4개: PARTIAL_OR_WAIT(처음 부족을 마주침) — 지금 2개는 바로 받고, 기다리면 전량 가능.
 *   WAIT/PARTIAL/GIVE_UP 전부 선택 가능.
 * - 5개: 지금 당장은 0개(grantableNow=0) — WAIT/GIVE_UP만 가능하고 PARTIAL은 선택지에서
 *   빠진다(BE `availableChoices`가 "0개 부분구매"라는 무의미한 선택지를 걸러내는 동작 재현).
 * - 6개 이상: 지금 2개는 되지만 기다려도 그 이상은 못 받는다(optimisticMax === grantableNow)
 *   — 기다리는 게 수학적으로 무의미하므로 WAIT이 선택지에서 빠지고 PARTIAL/GIVE_UP만
 *   가능하다(BE `QueueService.kt`의 2026-07-21 정정 — `optimisticMax > grantableNow`일 때만
 *   WAIT을 내려주는 동작을 재현).
 */
function advance(entry: MockQueueEntry): MockQueueEntry {
  if (entry.phase !== "waiting") {
    return entry;
  }
  if (entry.rank > 0) {
    entry.rank -= 1;
    return entry;
  }
  if (entry.quantity >= 3 && !entry.decisionResolved) {
    entry.phase = "decision";
    // 최초 1회만 기록(재폴링해도 마감이 뒤로 밀리지 않게) — BE의 mark-asked.lua와 동일 정책.
    entry.decisionAskedAt ??= Date.now();
    return entry;
  }
  entry.phase = "ready";
  return entry;
}

function toResponse(entry: MockQueueEntry) {
  switch (entry.phase) {
    case "ready":
      return {
        status: "READY" as const,
        rank: null,
        totalWaiting: null,
        quantity: entry.quantity,
        grantableNow: null,
        optimisticMax: null,
        pollIntervalMs: POLL_INTERVAL_MS,
        soldOutReason: null,
        availableChoices: null,
        decisionDeadlineEpochMs: null,
      };
    case "left":
      return {
        status: "NOT_IN_QUEUE" as const,
        rank: null,
        totalWaiting: null,
        quantity: null,
        grantableNow: null,
        optimisticMax: null,
        pollIntervalMs: POLL_INTERVAL_MS,
        soldOutReason: null,
        availableChoices: null,
        decisionDeadlineEpochMs: null,
      };
    case "decision": {
      // 데모용 고정 시나리오 3종 — 각 구간의 grantableNow/optimisticMax 관계로
      // availableChoices 를 BE 와 동일한 규칙(`optimisticMax > grantableNow` 일 때만
      // WAIT, `grantableNow > 0` 일 때만 PARTIAL)으로 도출한다.
      let grantableNow: number;
      let optimisticMax: number;
      if (entry.quantity <= 4) {
        grantableNow = Math.min(2, entry.quantity);
        optimisticMax = entry.quantity; // 기다리면 요청 수량까지 받을 수 있다고 가정.
      } else if (entry.quantity === 5) {
        grantableNow = 0; // 지금 당장은 0개.
        optimisticMax = entry.quantity;
      } else {
        // 6개 이상 — 기다려도 지금보다 더 받을 수 없다(optimisticMax === grantableNow).
        grantableNow = 2;
        optimisticMax = 2;
      }
      const choices: Array<"WAIT" | "PARTIAL" | "GIVE_UP"> = [];
      if (optimisticMax > grantableNow) choices.push("WAIT");
      if (grantableNow > 0) choices.push("PARTIAL");
      choices.push("GIVE_UP");
      return {
        status: "DECISION_REQUIRED" as const,
        rank: entry.rank,
        totalWaiting: entry.totalWaiting,
        quantity: entry.quantity,
        grantableNow,
        optimisticMax,
        pollIntervalMs: POLL_INTERVAL_MS,
        soldOutReason: null,
        availableChoices: choices,
        decisionDeadlineEpochMs: (entry.decisionAskedAt ?? Date.now()) + DECISION_TIMEOUT_MS,
      };
    }
    default:
      return {
        status: "WAITING" as const,
        rank: entry.rank,
        totalWaiting: entry.totalWaiting,
        quantity: entry.quantity,
        grantableNow: null,
        optimisticMax: null,
        pollIntervalMs: POLL_INTERVAL_MS,
        soldOutReason: null,
        availableChoices: null,
        decisionDeadlineEpochMs: null,
      };
  }
}

export const queueHandlers = [
  http.post("*/api/v1/queues/:dropId/entry", async ({ params, request }) => {
    const dropId = String(params.dropId);
    const body = (await request.json().catch(() => null)) as { quantity?: number } | null;
    const quantity = body?.quantity && body.quantity > 0 ? body.quantity : 1;

    const entry: MockQueueEntry = {
      quantity,
      rank: 2,
      totalWaiting: 3,
      phase: "waiting",
      decisionResolved: false,
      decisionAskedAt: null,
    };
    mockDb.queue.set(dropId, entry);
    return HttpResponse.json(toResponse(entry));
  }),

  http.get("*/api/v1/queues/:dropId/status", ({ params }) => {
    const dropId = String(params.dropId);
    const entry = mockDb.queue.get(dropId);
    if (!entry) {
      return HttpResponse.json({
        status: "NOT_IN_QUEUE",
        rank: null,
        totalWaiting: null,
        quantity: null,
        grantableNow: null,
        optimisticMax: null,
        pollIntervalMs: POLL_INTERVAL_MS,
        soldOutReason: null,
        availableChoices: null,
        decisionDeadlineEpochMs: null,
      });
    }
    return HttpResponse.json(toResponse(advance(entry)));
  }),

  http.post("*/api/v1/queues/:dropId/decision", async ({ params, request }) => {
    const dropId = String(params.dropId);
    const entry = mockDb.queue.get(dropId);
    if (!entry) {
      return HttpResponse.json(
        { error: "QUEUE_NOT_IN_QUEUE", message: "대기열에 진입한 적이 없습니다." },
        { status: 400 },
      );
    }
    const body = (await request.json().catch(() => null)) as { choice?: string } | null;
    switch (body?.choice) {
      case "GIVE_UP":
        entry.phase = "left";
        break;
      case "WAIT":
        entry.decisionResolved = true;
        entry.phase = "waiting";
        entry.rank = 0;
        break;
      case "PARTIAL":
        entry.quantity = Math.min(2, entry.quantity);
        entry.phase = "ready";
        break;
      default:
        return HttpResponse.json(
          { error: "INVALID_CHOICE", message: "choice는 필수입니다." },
          { status: 400 },
        );
    }
    return HttpResponse.json(toResponse(entry));
  }),
];

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { SELLER_ID } from "@/mocks/data/products";
import { server } from "@/mocks/server";
import { SettlementPanel } from "../ui/SettlementPanel";
import {
  useRetryFailedSettlements,
  useSellerSettlements,
  useSettlementBatchResults,
} from "./settlements.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("정산 조회·재시도 플로우 (MSW)", () => {
  it("월 필터로 판매자 정산을 조회한다", async () => {
    const { result } = renderHook(
      () =>
        useSellerSettlements("admin", undefined, {
          settlementMonth: "202606",
          page: 0,
          size: 10,
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.content.length).toBe(1);
    expect(result.current.data?.content[0]?.settlementMonth).toBe("202606");
  });

  it("판매자 ID를 GET 파라미터로 전달해 해당 판매자의 정산만 조회한다", async () => {
    let receivedSellerId: string | null = null;
    server.use(
      http.get("*/api/v1/settlements/seller/sellers", ({ request }) => {
        receivedSellerId = new URL(request.url).searchParams.get("sellerId");
        return HttpResponse.json({
          content: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
        });
      }),
    );

    const { result } = renderHook(
      () => useSellerSettlements("seller", SELLER_ID, { page: 0, size: 10 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(receivedSellerId).toBe(SELLER_ID);
  });

  it("관리자 판매자 정산 탭에서 sellerId를 입력해 검색한다", async () => {
    let receivedSellerId: string | null = null;
    server.use(
      http.get("*/api/v1/settlements/admin/sellers", ({ request }) => {
        receivedSellerId = new URL(request.url).searchParams.get("sellerId");
        return HttpResponse.json({
          content: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
        });
      }),
    );

    const user = userEvent.setup();
    render(<SettlementPanel scope="admin" />, { wrapper });

    const input = screen.getByRole("searchbox", { name: "판매자 ID 검색" });
    await user.type(input, SELLER_ID);
    await user.keyboard("{Enter}");

    await waitFor(() => expect(receivedSellerId).toBe(SELLER_ID));
  });

  it("관리자 주문별 정산 탭에서 sellerId와 orderId를 입력해 검색한다", async () => {
    const orderId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    let receivedSellerId: string | null = null;
    let receivedOrderId: string | null = null;
    server.use(
      http.get("*/api/v1/settlements/admin/orders", ({ request }) => {
        const url = new URL(request.url);
        receivedSellerId = url.searchParams.get("sellerId");
        receivedOrderId = url.searchParams.get("orderId");
        return HttpResponse.json({
          content: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
        });
      }),
    );

    const user = userEvent.setup();
    render(<SettlementPanel scope="admin" />, { wrapper });

    await user.click(screen.getByRole("tab", { name: "주문별 정산" }));
    await user.type(
      screen.getByRole("searchbox", { name: "주문별 정산 판매자 ID 검색" }),
      SELLER_ID,
    );
    await user.type(screen.getByRole("searchbox", { name: "주문 ID 검색" }), orderId);
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(receivedSellerId).toBe(SELLER_ID);
      expect(receivedOrderId).toBe(orderId);
    });
  });

  it("판매자 주문별 정산 탭에서 활성 sellerId와 입력한 orderId로 검색한다", async () => {
    const orderId = "order-1";
    let receivedSellerId: string | null = null;
    let receivedOrderId: string | null = null;
    server.use(
      http.get("*/api/v1/settlements/seller/orders", ({ request }) => {
        const url = new URL(request.url);
        receivedSellerId = url.searchParams.get("sellerId");
        receivedOrderId = url.searchParams.get("orderId");
        return HttpResponse.json({
          content: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
        });
      }),
    );

    const user = userEvent.setup();
    render(<SettlementPanel scope="seller" sellerId={SELLER_ID} />, { wrapper });

    await user.click(screen.getByRole("tab", { name: "주문별 정산" }));
    await user.type(screen.getByRole("searchbox", { name: "주문 ID 검색" }), orderId);
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(receivedSellerId).toBe(SELLER_ID);
      expect(receivedOrderId).toBe(orderId);
    });
  });

  it("관리자 배치 결과 조회에 월·상태·페이지 파라미터를 전달한다", async () => {
    let receivedQuery = "";
    server.use(
      http.get("*/api/v1/settlements/admin/batch-results", ({ request }) => {
        receivedQuery = new URL(request.url).search;
        return HttpResponse.json({
          content: [],
          page: 2,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        });
      }),
    );

    const { result } = renderHook(
      () =>
        useSettlementBatchResults({
          settlementMonth: "202506",
          status: "FAILED",
          page: 2,
          size: 20,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedQuery).toContain("settlementMonth=202506");
    expect(receivedQuery).toContain("status=FAILED");
    expect(receivedQuery).toContain("page=2");
    expect(receivedQuery).toContain("size=20");
  });

  it("실패한 배치 행에서 해당 정산월로 재정산한다", async () => {
    let retriedMonth: string | null = null;
    server.use(
      http.get("*/api/v1/settlements/admin/batch-results", () =>
        HttpResponse.json({
          content: [
            {
              batchId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
              settlementMonth: "202506",
              batchType: "LOAD_PAYMENT",
              status: "FAILED",
              startedAt: "2026-06-29T08:34:27.152Z",
              endedAt: "2026-06-29T08:35:27.152Z",
              totalOrderCount: 12,
              totalSellerCount: 3,
              totalSettlementAmount: 1_250_000,
              failReason: "결제 적재 실패",
              createdAt: "2026-06-29T08:34:27.152Z",
            },
          ],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        }),
      ),
      http.post("*/api/v1/settlements/admin/retry-failed", ({ request }) => {
        retriedMonth = new URL(request.url).searchParams.get("settlementMonth");
        return HttpResponse.json({
          batchId: "9ee94a8f-80d3-48c2-9078-292e80e44741",
          settlementMonth: retriedMonth,
          retriedSellerCount: 3,
          status: "RUNNING",
          failReason: null,
        });
      }),
    );

    const user = userEvent.setup();
    render(<SettlementPanel scope="admin" />, { wrapper });

    await user.click(screen.getByRole("tab", { name: "배치 결과" }));
    expect(await screen.findByText("결제 내역 적재")).toBeInTheDocument();
    expect(screen.getByText("실패")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "상태" }));
    expect(screen.getByRole("option", { name: "대기" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "진행 중" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "완료" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "실패" }));

    await user.click(screen.getByRole("button", { name: "재정산" }));

    await waitFor(() => expect(retriedMonth).toBe("202506"));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "2025.06 재정산 배치를 시작했습니다. (3개 판매자)",
    );
  });

  it("실패 정산을 재시도하면 COMPLETED 로 전환된다", async () => {
    const { result } = renderHook(
      () => ({
        retry: useRetryFailedSettlements(),
        failed: useSellerSettlements("admin", undefined, { status: "FAILED" }),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.failed.data).toBeDefined());
    expect(result.current.failed.data?.content.length).toBeGreaterThan(0);

    await act(async () => {
      const response = await result.current.retry.mutateAsync("202604");
      expect(response.retriedSellerCount).toBeGreaterThan(0);
    });

    await waitFor(() => expect(result.current.failed.data?.content.length).toBe(0));
  });
});

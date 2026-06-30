import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useCreatePayment } from "@/features/payment/api/payments.queries";
import { useCreateOrder, useOrder } from "./orders.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("구매 플로우 (주문→결제→완료, MSW 상태저장)", () => {
  it("OPEN 드롭을 주문하고 WALLET 결제하면 주문이 COMPLETED 된다", async () => {
    const { result } = renderHook(() => ({ order: useCreateOrder(), pay: useCreatePayment() }), {
      wrapper,
    });

    let orderId = "";
    await act(async () => {
      const created = await result.current.order.mutateAsync({
        dropId: "d1",
        quantity: 1,
        orderName: "한정판 운동화",
      });
      orderId = created.orderId;
      expect(created.status).toBe("PAYMENT_PENDING");

      const payment = await result.current.pay.mutateAsync({
        orderId,
        amount: created.amount,
        method: "WALLET",
      });
      expect(payment.status).toBe("APPROVED");
    });

    const { result: orderResult } = renderHook(() => useOrder(orderId), { wrapper });
    await waitFor(() => expect(orderResult.current.data?.status).toBe("COMPLETED"));
    expect(orderResult.current.data?.paymentId).not.toBeNull();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import {
  INITIAL_PRODUCT_SEARCH_REQUEST,
  type ProductSearchRequest,
  useProductSearch,
} from "./product-search.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const emptyPage = {
  content: [],
  page: 0,
  size: 50,
  totalElements: 0,
  totalPages: 0,
};

describe("useProductSearch", () => {
  it("첫 로딩부터 POST /api/v1/searchs/search를 기본 조건으로 호출한다", async () => {
    let receivedMethod = "";
    let receivedBody: unknown;
    server.use(
      http.post("*/api/v1/searchs/search", async ({ request }) => {
        receivedMethod = request.method;
        receivedBody = await request.json();
        return HttpResponse.json(emptyPage);
      }),
    );

    const { result } = renderHook(() => useProductSearch(INITIAL_PRODUCT_SEARCH_REQUEST), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedMethod).toBe("POST");
    expect(receivedBody).toEqual(INITIAL_PRODUCT_SEARCH_REQUEST);
  });

  it("카테고리명이 바뀌면 새 검색 본문으로 즉시 다시 호출한다", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post("*/api/v1/searchs/search", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(emptyPage);
      }),
    );

    const { result, rerender } = renderHook(
      ({ request }: { request: ProductSearchRequest }) => useProductSearch(request),
      { initialProps: { request: INITIAL_PRODUCT_SEARCH_REQUEST }, wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const categoryRequest: ProductSearchRequest = {
      ...INITIAL_PRODUCT_SEARCH_REQUEST,
      categoryName: "전자기기",
    };
    rerender({ request: categoryRequest });

    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toEqual(categoryRequest);
  });
});

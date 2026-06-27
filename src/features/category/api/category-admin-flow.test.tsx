import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "./categories.queries";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("카테고리 관리 플로우 (등록·수정·삭제, MSW)", () => {
  it("카테고리를 추가→이름 수정→삭제하면 목록이 그대로 반영된다", async () => {
    const { result } = renderHook(
      () => ({
        list: useCategories(),
        create: useCreateCategory(),
        update: useUpdateCategory(),
        remove: useDeleteCategory(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.list.data).toBeDefined());

    await act(async () => {
      await result.current.create.mutateAsync({ name: "테스트분류" });
    });
    await waitFor(() =>
      expect(result.current.list.data?.some((c) => c.name === "테스트분류")).toBe(true),
    );

    const created = result.current.list.data?.find((c) => c.name === "테스트분류");
    expect(created).toBeDefined();
    const id = created?.id ?? "";

    await act(async () => {
      await result.current.update.mutateAsync({ id, name: "테스트분류수정" });
    });
    await waitFor(() =>
      expect(result.current.list.data?.some((c) => c.name === "테스트분류수정")).toBe(true),
    );

    await act(async () => {
      await result.current.remove.mutateAsync(id);
    });
    await waitFor(() => expect(result.current.list.data?.some((c) => c.id === id)).toBe(false));
  });
});

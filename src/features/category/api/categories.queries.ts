import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createCategory, deleteCategory, fetchCategories, updateCategory } from "./categories.api";

export const categoryQueries = {
  list: () =>
    queryOptions({
      queryKey: ["categories", "list"] as const,
      queryFn: fetchCategories,
      staleTime: 5 * 60_000,
    }),
};

export function useCategories() {
  return useQuery(categoryQueries.list());
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      updateCategory(input.id, { name: input.name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

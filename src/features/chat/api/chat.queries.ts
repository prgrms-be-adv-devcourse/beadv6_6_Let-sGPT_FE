import { queryOptions, useQuery } from "@tanstack/react-query";

import { getChatCapabilities } from "./chat.api";

export const chatQueries = {
  capabilities: () =>
    queryOptions({
      queryKey: ["chat", "capabilities"] as const,
      queryFn: getChatCapabilities,
      staleTime: 5 * 60_000,
    }),
};

export function useChatCapabilities() {
  return useQuery(chatQueries.capabilities());
}

import { QueryClient } from "@tanstack/react-query";

import { shouldRetryDesktopQuery } from "@/lib/query/query-retry-policy";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryDesktopQuery,
      staleTime: 30_000,
    },
  },
});

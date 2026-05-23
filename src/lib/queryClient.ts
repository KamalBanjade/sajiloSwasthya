import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // stale-while-revalidate: show cached data instantly, refetch silently in background
      staleTime: 1000 * 60 * 2,        // data is "fresh" for 2 minutes — no refetch at all
      gcTime: 1000 * 60 * 10,          // keep unused data in memory for 10 minutes
      refetchOnWindowFocus: false,      // don't hit the server just because user switched tabs
      refetchOnReconnect: true,         // but do refetch when internet comes back
      retry: 1,                         // only retry once on failure (not 3x default)
    },
  },
});

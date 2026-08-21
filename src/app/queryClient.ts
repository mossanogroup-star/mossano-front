import { QueryClient } from "@tanstack/react-query";

/**
 * A fresh client per request on the server, one shared client in the browser.
 *
 * The distinction is load-bearing: a module-level client on the server would be
 * shared between concurrent requests, and one visitor's private selection could
 * be served out of the cache to another. So the server calls this per render
 * and throws the client away afterwards.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Long enough that hydration does not immediately re-fetch everything
        // the server already rendered, short enough that an availability change
        // shows up on the next navigation.
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // A 404 is an answer, not a failure — retrying a withdrawn stone
          // three times just delays the "not found" page.
          const status = (error as { status?: number })?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

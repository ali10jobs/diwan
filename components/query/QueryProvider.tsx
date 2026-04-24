"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * TanStack Query provider. Per CLAUDE.md → "Non-Negotiable Conventions",
 * TanStack Query is the cache for server state — no Redux, no React
 * Context for server state. The client is instantiated once per app
 * mount (`useState` keeps it stable across rerenders) and tuned for
 * the admin-dashboard traffic pattern:
 *   - `staleTime: 30s` — users flip between screens fast; avoid refetch
 *     storms while still picking up updates within a work session.
 *   - `refetchOnWindowFocus: false` — the fixture backend never drifts
 *     from under us; refetch on focus is noise here.
 *   - `retry: 1` — the mock backend doesn't flake, but transient issues
 *     in prod should still get one retry.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: { retry: 0 },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseTransactionsQuery, type TransactionsQuery } from "@/lib/url/transactions-query";
import { transactionsQueryString } from "@/lib/url/transactions-query-serialize";

/**
 * The URL is the single source of truth for the Transactions screen state
 * (page, sort, filters). This hook reads the current query from the URL
 * and exposes a setter that writes back via `router.replace`.
 *
 * `replace` (not `push`) is intentional — paging/sorting should not
 * pollute the browser back stack. Returning to the page from elsewhere
 * still restores the last filter state because the URL itself is the
 * carrier.
 */
export function useTransactionsUrlState(): {
  query: TransactionsQuery;
  setQuery: (next: TransactionsQuery | ((prev: TransactionsQuery) => TransactionsQuery)) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    // `useSearchParams` returns a `ReadonlyURLSearchParams`; clone into
    // a mutable URLSearchParams that the parser accepts.
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    try {
      return parseTransactionsQuery(params);
    } catch {
      // Malformed URLs (manual edit, stale link) fall back to defaults
      // rather than crashing the screen. The route handler still
      // validates and would surface its own error if the URL were
      // pushed back unmodified.
      return parseTransactionsQuery(new URLSearchParams());
    }
  }, [searchParams]);

  const setQuery = useCallback(
    (next: TransactionsQuery | ((prev: TransactionsQuery) => TransactionsQuery)) => {
      const resolved = typeof next === "function" ? next(query) : next;
      const suffix = transactionsQueryString(resolved);
      router.replace(`${pathname}${suffix}`, { scroll: false });
    },
    [pathname, query, router],
  );

  return { query, setQuery };
}

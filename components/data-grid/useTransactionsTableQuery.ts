"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchTransactions, type TransactionsPage } from "@/lib/api/transactions-client";
import { queryKeys } from "@/lib/query/keys";
import type { TransactionsQuery } from "@/lib/url/transactions-query";

/**
 * TanStack Query wrapper for the transactions list endpoint.
 *
 * `placeholderData: keepPreviousData` is the load-bearing choice here:
 * users page through and re-sort the 50k-row dataset rapidly, and we
 * want the previous page's rows to stay visible during the in-flight
 * refetch so the table never collapses to a spinner. The new page
 * swaps in atomically once it lands.
 */
export function useTransactionsTableQuery(query: TransactionsQuery) {
  return useQuery<TransactionsPage>({
    queryKey: queryKeys.transactions.list(query),
    queryFn: ({ signal }) => fetchTransactions(query, signal),
    placeholderData: keepPreviousData,
  });
}

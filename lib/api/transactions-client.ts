import type { Transaction } from "@/lib/types/transaction";
import { transactionsQueryString } from "@/lib/url/transactions-query-serialize";
import type { TransactionsQuery } from "@/lib/url/transactions-query";

export type TransactionsPage = {
  items: Transaction[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function fetchTransactions(
  query: TransactionsQuery,
  signal?: AbortSignal,
): Promise<TransactionsPage> {
  const init: RequestInit = { headers: { accept: "application/json" } };
  if (signal) init.signal = signal;
  const res = await fetch(`/api/transactions${transactionsQueryString(query)}`, init);
  if (!res.ok) {
    // Surfacing the response body lets the error boundary show the route
    // handler's localized message + errorId without re-deriving them.
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {
      // ignore non-JSON error bodies
    }
    const err = new Error(`transactions request failed: ${res.status}`) as Error & {
      status?: number;
      detail?: unknown;
    };
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return (await res.json()) as TransactionsPage;
}

import type { CustomersQuery } from "@/lib/url/customers-query";
import type { TransactionsQuery } from "@/lib/url/transactions-query";

// Shared query-key factory — every cache read and invalidation goes
// through these so the key shape stays typed and centrally rename-able.
// TanStack Query hashes plain objects structurally, so equal queries
// collapse onto the same cache entry without any manual canonicalization.

export const queryKeys = {
  transactions: {
    all: ["transactions"] as const,
    list: (params: TransactionsQuery) => ["transactions", "list", params] as const,
    byId: (id: string) => ["transactions", "detail", id] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: (params: CustomersQuery) => ["customers", "list", params] as const,
    byId: (id: string) => ["customers", "detail", id] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;

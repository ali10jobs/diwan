import type { TransactionsQuery } from "./transactions-query";

// Inverse of `parseTransactionsQuery` — round-trips a typed query back to
// `URLSearchParams` so the client can drive `router.replace(...)` and the
// server can re-parse the same shape. Keys omitted when they equal the
// schema defaults to keep URLs short and shareable.

export function serializeTransactionsQuery(q: TransactionsQuery): URLSearchParams {
  const out = new URLSearchParams();

  if (q.status?.length) out.set("status", q.status.join(","));
  if (q.type?.length) out.set("type", q.type.join(","));
  if (q.channel?.length) out.set("channel", q.channel.join(","));
  if (q.governorate?.length) out.set("governorate", q.governorate.join(","));
  if (q.minAmount !== undefined) out.set("minAmount", String(q.minAmount));
  if (q.maxAmount !== undefined) out.set("maxAmount", String(q.maxAmount));
  if (q.dateFrom) out.set("dateFrom", q.dateFrom);
  if (q.dateTo) out.set("dateTo", q.dateTo);
  if (q.page !== 1) out.set("page", String(q.page));
  if (q.pageSize !== 100) out.set("pageSize", String(q.pageSize));

  // Sort default is `{ field: "createdAt", direction: "desc" }`.
  const isDefaultSort = q.sort.field === "createdAt" && q.sort.direction === "desc";
  if (!isDefaultSort) {
    const prefix = q.sort.direction === "desc" ? "-" : "";
    out.set("sort", `${prefix}${q.sort.field}`);
  }

  return out;
}

/** Convenience: produce a `?...` suffix or empty string. */
export function transactionsQueryString(q: TransactionsQuery): string {
  const params = serializeTransactionsQuery(q);
  const s = params.toString();
  return s ? `?${s}` : "";
}

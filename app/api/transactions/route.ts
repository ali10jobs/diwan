import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { simulatedLatency } from "@/lib/api/latency";
import { badRequestFromZod, jsonError } from "@/lib/api/errors";
import { getTransactions } from "@/lib/fixtures/seed";
import type { Transaction } from "@/lib/types/transaction";
import { parseTransactionsQuery, type TransactionsQuery } from "@/lib/url/transactions-query";

export const dynamic = "force-dynamic";

type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function applyFilters(rows: readonly Transaction[], q: TransactionsQuery): Transaction[] {
  const from = q.dateFrom ? Date.parse(q.dateFrom) : undefined;
  const to = q.dateTo ? Date.parse(q.dateTo) : undefined;
  const statusSet = q.status ? new Set(q.status) : null;
  const typeSet = q.type ? new Set(q.type) : null;
  const channelSet = q.channel ? new Set(q.channel) : null;
  const governorateSet = q.governorate ? new Set(q.governorate) : null;

  const out: Transaction[] = [];
  for (const t of rows) {
    if (statusSet && !statusSet.has(t.status)) continue;
    if (typeSet && !typeSet.has(t.type)) continue;
    if (channelSet && !channelSet.has(t.channel)) continue;
    if (governorateSet && !governorateSet.has(t.governorate)) continue;
    if (q.minAmount !== undefined && t.amountSar < q.minAmount) continue;
    if (q.maxAmount !== undefined && t.amountSar > q.maxAmount) continue;
    if (from !== undefined && Date.parse(t.createdAt) < from) continue;
    // `dateTo` is exclusive per CLAUDE.md → URL query-param contract.
    if (to !== undefined && Date.parse(t.createdAt) >= to) continue;
    out.push(t);
  }
  return out;
}

function applySort(rows: Transaction[], q: TransactionsQuery): Transaction[] {
  const { field, direction } = q.sort;
  const mul = direction === "asc" ? 1 : -1;
  return rows.sort((a, b) => {
    if (field === "amountSar") return (a.amountSar - b.amountSar) * mul;
    // createdAt: lexicographic is safe for ISO-8601 UTC strings.
    return a.createdAt < b.createdAt ? -mul : a.createdAt > b.createdAt ? mul : 0;
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const query = parseTransactionsQuery(url.searchParams);

    await simulatedLatency();

    const all = getTransactions();
    const filtered = applyFilters(all, query);
    const sorted = applySort(filtered.slice(), query);

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const offset = (query.page - 1) * query.pageSize;
    const items = sorted.slice(offset, offset + query.pageSize);

    const body: Page<Transaction> = {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
    };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof ZodError) return badRequestFromZod(err);
    return jsonError(500, "internal", "Unexpected error");
  }
}

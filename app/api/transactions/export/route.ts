import { ZodError, z } from "zod";
import { badRequestFromZod, jsonError } from "@/lib/api/errors";
import { simulatedLatency } from "@/lib/api/latency";
import { getTransactions } from "@/lib/fixtures/seed";
import { isLocale, isNumeralSystem } from "@/lib/i18n/config";
import type { Locale, NumeralSystem } from "@/lib/i18n/config";
import type { Transaction } from "@/lib/types/transaction";
import { parseTransactionsQuery, type TransactionsQuery } from "@/lib/url/transactions-query";
import { buildTransactionsCsvHeader, makeTransactionRowFormatter } from "@/lib/csv/transactions";
import { UTF8_BOM } from "@/lib/csv/serialize";

export const dynamic = "force-dynamic";

// Hard cap on rows in a single export. The seeded fixture has 50k;
// even a future unbounded backend wants a ceiling here so a malformed
// query can't spool gigabytes through Fluid Compute.
const MAX_ROWS = 100_000;

const localeSchema = z.string().refine(isLocale, "invalid locale");
const numeralsSchema = z.string().refine(isNumeralSystem, "invalid numerals");

function applyFilters(rows: readonly Transaction[], q: TransactionsQuery): Transaction[] {
  // Mirror of /api/transactions filter logic. Kept inline so this
  // route stays self-contained and the json route's response shape
  // doesn't constrain the export contract.
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
    return a.createdAt < b.createdAt ? -mul : a.createdAt > b.createdAt ? mul : 0;
  });
}

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);

    // The export route uses the same filter+sort vocabulary as the json
    // route but ignores `page` and `pageSize` (we always export the full
    // matched set, capped at MAX_ROWS).
    const params = new URLSearchParams(url.searchParams);
    const localeParam = params.get("locale") ?? "en";
    const numeralsParam = params.get("numerals") ?? "auto";
    params.delete("locale");
    params.delete("numerals");
    params.delete("page");
    params.delete("pageSize");

    const locale: Locale = localeSchema.parse(localeParam) as Locale;
    const numerals: NumeralSystem = numeralsSchema.parse(numeralsParam) as NumeralSystem;
    const query = parseTransactionsQuery(params);

    await simulatedLatency();

    const all = getTransactions();
    const filtered = applyFilters(all, query);
    const sorted = applySort(filtered.slice(), query).slice(0, MAX_ROWS);

    const formatRow = makeTransactionRowFormatter(locale, numerals);
    const header = buildTransactionsCsvHeader(locale);
    const encoder = new TextEncoder();

    // Stream the body so a 100k-row export never sits in memory as a
    // single string. Chunk in batches to amortize encoder overhead.
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(UTF8_BOM + header));
        const BATCH = 500;
        let i = 0;
        const pump = () => {
          const end = Math.min(sorted.length, i + BATCH);
          let chunk = "";
          for (; i < end; i++) chunk += formatRow(sorted[i]!);
          if (chunk) controller.enqueue(encoder.encode(chunk));
          if (i < sorted.length) {
            // Yield to the event loop between batches.
            setTimeout(pump, 0);
          } else {
            controller.close();
          }
        };
        pump();
      },
    });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `transactions-${stamp}.csv`;

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Prevent intermediaries from caching a per-user export.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof ZodError) return badRequestFromZod(err);
    return jsonError(500, "internal", "Unexpected error");
  }
}

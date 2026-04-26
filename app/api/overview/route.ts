import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { simulatedLatency } from "@/lib/api/latency";
import { badRequestFromZod, jsonError } from "@/lib/api/errors";
import { getTransactions } from "@/lib/fixtures/seed";
import type { Transaction, Governorate } from "@/lib/types/transaction";
import { GOVERNORATES } from "@/lib/types/transaction";
import { parseOverviewQuery } from "@/lib/url/overview-query";
import type {
  OverviewGovernoratePoint,
  OverviewResponse,
  OverviewTimePoint,
} from "@/lib/types/overview";

export const dynamic = "force-dynamic";

// Default window: trailing 90 days from the latest fixture timestamp.
// Resolved here, not in the schema, so the schema stays parse-only.
const DEFAULT_WINDOW_DAYS = 90;

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function resolveWindow(
  rows: readonly Transaction[],
  from: string | undefined,
  to: string | undefined,
): { fromMs: number; toMs: number } {
  // The fixture window ends at a known clock; using the *last seen*
  // tx as anchor keeps the demo stable across seed bumps.
  const last = rows[rows.length - 1];
  const anchorMs = last ? Date.parse(last.createdAt) : Date.now();
  const toMs = to ? Date.parse(to) : anchorMs;
  const fromMs = from ? Date.parse(from) : toMs - DEFAULT_WINDOW_DAYS * 86_400_000;
  return { fromMs, toMs };
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const query = parseOverviewQuery(url.searchParams);

    await simulatedLatency();

    const all = getTransactions();
    const { fromMs, toMs } = resolveWindow(all, query.dateFrom, query.dateTo);

    let revenueSar = 0;
    let successfulCount = 0;
    let failedCount = 0;
    let total = 0;
    const activeCustomers = new Set<string>();
    const byDay = new Map<string, OverviewTimePoint>();
    const byGov = new Map<Governorate, OverviewGovernoratePoint>();
    for (const g of GOVERNORATES) {
      byGov.set(g, {
        governorate: g,
        revenueSar: 0,
        succeededSar: 0,
        failedSar: 0,
        pendingSar: 0,
        reversedSar: 0,
      });
    }

    for (const t of all) {
      const ms = Date.parse(t.createdAt);
      if (ms < fromMs || ms > toMs) continue;
      total++;
      activeCustomers.add(t.customerId);

      if (t.status === "succeeded") {
        revenueSar += t.amountSar;
        successfulCount++;
      } else if (t.status === "failed") {
        failedCount++;
      }

      const day = isoDate(ms);
      let pt = byDay.get(day);
      if (!pt) {
        pt = { date: day, revenueSar: 0, successfulCount: 0, failedCount: 0 };
        byDay.set(day, pt);
      }
      if (t.status === "succeeded") {
        pt.revenueSar += t.amountSar;
        pt.successfulCount++;
      } else if (t.status === "failed") {
        pt.failedCount++;
      }

      const gov = byGov.get(t.governorate)!;
      gov.revenueSar += t.amountSar;
      switch (t.status) {
        case "succeeded":
          gov.succeededSar += t.amountSar;
          break;
        case "failed":
          gov.failedSar += t.amountSar;
          break;
        case "pending":
          gov.pendingSar += t.amountSar;
          break;
        case "reversed":
          gov.reversedSar += t.amountSar;
          break;
      }
    }

    const timeSeries = [...byDay.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
    const governorateBreakdown = [...byGov.values()].sort((a, b) => b.revenueSar - a.revenueSar);

    const body: OverviewResponse = {
      kpis: {
        revenueSar,
        successfulCount,
        failureRate: total === 0 ? 0 : failedCount / total,
        arpuSar: activeCustomers.size === 0 ? 0 : Math.round(revenueSar / activeCustomers.size),
        activeCustomers: activeCustomers.size,
      },
      timeSeries,
      governorateBreakdown,
      window: { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() },
    };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof ZodError) return badRequestFromZod(err);
    return jsonError(500, "internal", "Unexpected error");
  }
}

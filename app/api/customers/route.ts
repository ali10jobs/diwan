import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { simulatedLatency } from "@/lib/api/latency";
import { badRequestFromZod, jsonError } from "@/lib/api/errors";
import { getCustomers } from "@/lib/fixtures/seed";
import type { Customer } from "@/lib/types/customer";
import { parseCustomersQuery, type CustomersQuery } from "@/lib/url/customers-query";

export const dynamic = "force-dynamic";

type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function applyFilters(rows: readonly Customer[], q: CustomersQuery): Customer[] {
  const tierSet = q.tier ? new Set(q.tier) : null;
  const statusSet = q.status ? new Set(q.status) : null;
  const governorateSet = q.governorate ? new Set(q.governorate) : null;
  const qLower = q.q?.toLowerCase();

  const out: Customer[] = [];
  for (const c of rows) {
    if (tierSet && !tierSet.has(c.tier)) continue;
    if (statusSet && !statusSet.has(c.status)) continue;
    if (governorateSet && !governorateSet.has(c.governorate)) continue;
    if (qLower) {
      const hay =
        c.displayName.en.toLowerCase() + "\n" + c.displayName.ar + "\n" + c.msisdn.toLowerCase();
      if (!hay.includes(qLower) && !c.displayName.ar.includes(q.q!)) continue;
    }
    out.push(c);
  }
  return out;
}

function applySort(rows: Customer[], q: CustomersQuery): Customer[] {
  const { field, direction } = q.sort;
  const mul = direction === "asc" ? 1 : -1;
  return rows.sort((a, b) => {
    if (field === "lifetimeValueSar") return (a.lifetimeValueSar - b.lifetimeValueSar) * mul;
    return a.joinedAt < b.joinedAt ? -mul : a.joinedAt > b.joinedAt ? mul : 0;
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const query = parseCustomersQuery(url.searchParams);

    await simulatedLatency();

    const all = getCustomers();
    const filtered = applyFilters(all, query);
    const sorted = applySort(filtered.slice(), query);

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const offset = (query.page - 1) * query.pageSize;
    const items = sorted.slice(offset, offset + query.pageSize);

    const body: Page<Customer> = {
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

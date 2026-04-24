import { ZodError } from "zod";
import { parseTransactionsQuery } from "@/lib/url/transactions-query";

function parse(qs: string) {
  return parseTransactionsQuery(new URLSearchParams(qs));
}

describe("parseTransactionsQuery", () => {
  it("defaults when no params are provided", () => {
    const q = parse("");
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(100);
    expect(q.sort).toEqual({ field: "createdAt", direction: "desc" });
  });

  it("parses comma-separated status + type arrays", () => {
    const q = parse("status=failed,pending&type=topup");
    expect(q.status).toEqual(["failed", "pending"]);
    expect(q.type).toEqual(["topup"]);
  });

  it("coerces numeric page/pageSize", () => {
    const q = parse("page=3&pageSize=50");
    expect(q.page).toBe(3);
    expect(q.pageSize).toBe(50);
  });

  it("parses the canonical URL from CLAUDE.md", () => {
    const q = parse(
      "status=failed,pending&type=topup&minAmount=10000&dateFrom=2026-03-01T00:00:00Z&dateTo=2026-04-01T00:00:00Z&page=1&pageSize=100&sort=-createdAt",
    );
    expect(q.status).toEqual(["failed", "pending"]);
    expect(q.type).toEqual(["topup"]);
    expect(q.minAmount).toBe(10000);
    expect(q.dateFrom).toBe("2026-03-01T00:00:00Z");
    expect(q.dateTo).toBe("2026-04-01T00:00:00Z");
    expect(q.sort).toEqual({ field: "createdAt", direction: "desc" });
  });

  it("`-field` sort means desc, bare field means asc", () => {
    expect(parse("sort=createdAt").sort).toEqual({ field: "createdAt", direction: "asc" });
    expect(parse("sort=-amountSar").sort).toEqual({ field: "amountSar", direction: "desc" });
  });

  it("rejects unknown keys (strict schema)", () => {
    expect(() => parse("nope=yes")).toThrow(ZodError);
  });

  it("rejects invalid status value", () => {
    expect(() => parse("status=bogus")).toThrow(ZodError);
  });

  it("rejects non-ISO date", () => {
    expect(() => parse("dateFrom=2026-03-01")).toThrow(ZodError);
  });

  it("rejects pageSize above 500", () => {
    expect(() => parse("pageSize=501")).toThrow(ZodError);
  });
});

import { parseTransactionsQuery } from "@/lib/url/transactions-query";
import {
  serializeTransactionsQuery,
  transactionsQueryString,
} from "@/lib/url/transactions-query-serialize";

describe("serializeTransactionsQuery", () => {
  it("omits defaults so URLs stay clean", () => {
    const q = parseTransactionsQuery(new URLSearchParams());
    expect(serializeTransactionsQuery(q).toString()).toBe("");
  });

  it("round-trips a fully specified query", () => {
    const original = new URLSearchParams(
      "status=failed,pending&type=topup&channel=app&governorate=riyadh,makkah" +
        "&minAmount=10000&maxAmount=500000" +
        "&dateFrom=2026-03-01T00:00:00Z&dateTo=2026-04-01T00:00:00Z" +
        "&page=3&pageSize=50&sort=amountSar",
    );
    const parsed = parseTransactionsQuery(original);
    const serialized = serializeTransactionsQuery(parsed);
    const reparsed = parseTransactionsQuery(serialized);
    expect(reparsed).toEqual(parsed);
  });

  it("encodes a non-default sort with the `-` prefix for desc", () => {
    const parsed = parseTransactionsQuery(new URLSearchParams("sort=-amountSar"));
    expect(serializeTransactionsQuery(parsed).get("sort")).toBe("-amountSar");
  });

  it("transactionsQueryString prefixes `?` only when params exist", () => {
    const empty = parseTransactionsQuery(new URLSearchParams());
    expect(transactionsQueryString(empty)).toBe("");
    const filtered = parseTransactionsQuery(new URLSearchParams("status=failed"));
    expect(transactionsQueryString(filtered)).toBe("?status=failed");
  });
});

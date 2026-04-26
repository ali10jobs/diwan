import { applyTransactionFilter } from "@/lib/ai/tools";

describe("applyTransactionFilter schema", () => {
  test("accepts a fully populated filter", () => {
    const parsed = applyTransactionFilter.parse({
      status: ["failed", "pending"],
      type: ["topup"],
      channel: ["app"],
      governorate: ["riyadh"],
      minAmountSar: 100,
      maxAmountSar: 5000,
      dateFrom: "2026-04-01T00:00:00Z",
      dateTo: "2026-05-01T00:00:00Z",
    });
    expect(parsed.status).toEqual(["failed", "pending"]);
    expect(parsed.minAmountSar).toBe(100);
  });

  test("rejects unknown statuses", () => {
    expect(() => applyTransactionFilter.parse({ status: ["bogus"] })).toThrow();
  });

  test("rejects negative amounts", () => {
    expect(() => applyTransactionFilter.parse({ minAmountSar: -1 })).toThrow();
  });

  test("rejects malformed dates", () => {
    expect(() => applyTransactionFilter.parse({ dateFrom: "yesterday" })).toThrow();
  });

  test("accepts an empty object — agent may emit a no-op tool call", () => {
    const parsed = applyTransactionFilter.parse({});
    expect(parsed).toEqual({});
  });
});

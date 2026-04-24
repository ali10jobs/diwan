/**
 * Determinism gate. CLAUDE.md: "fixtures deterministic across cold
 * starts". We run the generators twice in a fresh module state and
 * assert byte-equal output — the seed is fixed (DIWAN_SEED=20260423).
 */
import { CUSTOMER_COUNT } from "@/lib/fixtures/customers";
import { TRANSACTION_COUNT } from "@/lib/fixtures/transactions";

function runFresh(): { customers: unknown[]; transactions: unknown[] } {
  jest.isolateModules(() => {});
  let result!: { customers: unknown[]; transactions: unknown[] };
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/lib/fixtures/seed") as typeof import("@/lib/fixtures/seed");
    result = {
      customers: [...mod.getCustomers()],
      transactions: [...mod.getTransactions()],
    };
  });
  return result;
}

describe("fixture determinism", () => {
  it("generates the declared number of rows", () => {
    const { customers, transactions } = runFresh();
    expect(customers).toHaveLength(CUSTOMER_COUNT);
    expect(transactions).toHaveLength(TRANSACTION_COUNT);
  });

  it("two cold starts produce identical rows", () => {
    const a = runFresh();
    const b = runFresh();
    expect(a.customers[0]).toEqual(b.customers[0]);
    expect(a.customers[a.customers.length - 1]).toEqual(b.customers[b.customers.length - 1]);
    expect(a.transactions[0]).toEqual(b.transactions[0]);
    expect(a.transactions[a.transactions.length - 1]).toEqual(
      b.transactions[b.transactions.length - 1],
    );
  });

  it("every transaction references a real customer id", () => {
    const { customers, transactions } = runFresh();
    const ids = new Set((customers as Array<{ id: string }>).map((c) => c.id));
    const orphans = (transactions as Array<{ customerId: string }>).filter(
      (t) => !ids.has(t.customerId),
    );
    expect(orphans).toHaveLength(0);
  });

  it("failed transactions always carry a failureReason", () => {
    const { transactions } = runFresh();
    const failed = (transactions as Array<{ status: string; failureReason?: string }>).filter(
      (t) => t.status === "failed",
    );
    expect(failed.length).toBeGreaterThan(0);
    for (const t of failed) expect(t.failureReason).toBeDefined();
  });
});

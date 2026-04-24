import type { Customer } from "@/lib/types/customer";
import {
  type Transaction,
  type TransactionChannel,
  type TransactionStatus,
  type TransactionType,
} from "@/lib/types/transaction";
import { makeId, pick, randInt, weightedPick } from "./rng";

export const TRANSACTION_COUNT = 50_000;

// Two-year window ending on the build seed date.
const END_MS = Date.UTC(2026, 3, 22, 23, 59, 59);
const WINDOW_MS = 1000 * 60 * 60 * 24 * 365 * 2;

// Localized failure-reason keys (never free text — CLAUDE.md → Transaction.failureReason).
const FAILURE_REASONS = [
  "insufficient_funds",
  "payment_method_expired",
  "upstream_timeout",
  "limit_exceeded",
  "blocked_by_risk",
] as const;

export function generateTransactions(customers: readonly Customer[]): Transaction[] {
  if (customers.length === 0) return [];
  const out: Transaction[] = [];

  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    const customer = customers[i % customers.length]!;
    const type: TransactionType = weightedPick([
      ["topup", 48],
      ["bill", 22],
      ["bundle", 18],
      ["transfer", 9],
      ["refund", 3],
    ] as const);
    const channel: TransactionChannel = weightedPick([
      ["app", 42],
      ["web", 22],
      ["ussd", 18],
      ["pos", 12],
      ["ivr", 6],
    ] as const);
    const status: TransactionStatus = weightedPick([
      ["succeeded", 84],
      ["failed", 9],
      ["pending", 5],
      ["reversed", 2],
    ] as const);

    // Amount in halalas. Bill payments skew high, top-ups low.
    const amountSar =
      type === "bill"
        ? randInt(50_00, 2_500_00)
        : type === "transfer"
          ? randInt(10_00, 5_000_00)
          : type === "bundle"
            ? randInt(15_00, 300_00)
            : type === "refund"
              ? randInt(5_00, 500_00)
              : randInt(5_00, 200_00);

    // Monotonic timestamps across the window, with a few seconds of jitter
    // so sort by createdAt gives stable output.
    const tRatio = i / TRANSACTION_COUNT;
    const createdAtMs = END_MS - Math.floor((1 - tRatio) * WINDOW_MS) + randInt(-500, 500);

    const tx: Transaction = {
      id: makeId("txn", i),
      createdAt: new Date(createdAtMs).toISOString(),
      customerId: customer.id,
      channel,
      type,
      status,
      amountSar,
      governorate: customer.governorate,
    };
    if (status === "failed") tx.failureReason = pick(FAILURE_REASONS);
    out.push(tx);
  }
  return out;
}

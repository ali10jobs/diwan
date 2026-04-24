import type { Customer } from "@/lib/types/customer";
import type { Transaction } from "@/lib/types/transaction";
import { generateCustomers } from "./customers";
import { generateTransactions } from "./transactions";

// Materialized once per warm function instance. Fluid Compute's
// cross-request reuse means the 50k rows are built once and served to
// every concurrent request from the same in-memory arrays — matches
// CLAUDE.md's "Architectural Decisions" note on mock backend shape.

let customersCache: Customer[] | null = null;
let transactionsCache: Transaction[] | null = null;

export function getCustomers(): readonly Customer[] {
  if (!customersCache) customersCache = generateCustomers();
  return customersCache;
}

export function getTransactions(): readonly Transaction[] {
  if (!transactionsCache) transactionsCache = generateTransactions(getCustomers());
  return transactionsCache;
}

// Test helpers — clear the module-cached arrays between runs that
// tweak the seed. Not exposed in production code paths.
export function __resetFixturesForTests(): void {
  customersCache = null;
  transactionsCache = null;
}

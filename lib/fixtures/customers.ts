import {
  CUSTOMER_STATUSES,
  CUSTOMER_TIERS,
  type Customer,
  type CustomerStatus,
  type CustomerTier,
} from "@/lib/types/customer";
import { GOVERNORATES, type Governorate } from "@/lib/types/transaction";
import { FAMILY_NAMES, GIVEN_NAMES } from "./names";
import { makeId, pick, randInt, weightedPick } from "./rng";

// 2k customers. The LTV + status + tier distribution is picked so the
// governorate revenue stacked bar on the Overview screen has visible
// shape rather than a flat line.
export const CUSTOMER_COUNT = 2_000;

// 2021-01-01 → 2026-04-22 (one day before CLAUDE.md's build seed).
const JOIN_START_MS = Date.UTC(2021, 0, 1);
const JOIN_RANGE_MS = Date.UTC(2026, 3, 22) - JOIN_START_MS;

export function generateCustomers(): Customer[] {
  const out: Customer[] = [];
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const given = pick(GIVEN_NAMES);
    const family = pick(FAMILY_NAMES);
    const tier: CustomerTier = weightedPick<CustomerTier>([
      ["prepaid", 60],
      ["postpaid", 35],
      ["enterprise", 5],
    ]);
    const status: CustomerStatus = weightedPick<CustomerStatus>([
      ["active", 82],
      ["suspended", 8],
      ["churned", 10],
    ]);
    const governorate: Governorate = weightedPick([
      ["riyadh", 32],
      ["makkah", 18],
      ["eastern", 17],
      ["asir", 6],
      ["madinah", 6],
      ["qassim", 5],
      ["hail", 3],
      ["tabuk", 3],
      ["najran", 2],
      ["jazan", 3],
      ["jouf", 2],
      ["bahah", 1],
      ["northern", 2],
    ] as const);

    // LTV in halalas. Enterprise customers skew high, prepaid low.
    const ltvBase =
      tier === "enterprise"
        ? randInt(200_000_00, 5_000_000_00)
        : tier === "postpaid"
          ? randInt(10_000_00, 120_000_00)
          : randInt(200_00, 30_000_00);

    // MSISDN: +9665XXXXXXXX (KSA mobile block). Deterministic 8-digit
    // suffix seeded by the customer index so the number stays stable.
    const suffix = (50_000_000 + i * 7 + randInt(0, 9_999)).toString().padStart(8, "0");

    out.push({
      id: makeId("cust", i),
      msisdn: `+9665${suffix}`,
      displayName: {
        ar: `${given.ar} ${family.ar}`,
        en: `${given.en} ${family.en}`,
      },
      tier,
      governorate,
      joinedAt: new Date(
        JOIN_START_MS + Math.floor((i / CUSTOMER_COUNT) * JOIN_RANGE_MS),
      ).toISOString(),
      lifetimeValueSar: ltvBase,
      status,
    });
  }
  return out;
}

void GOVERNORATES; // intentional: re-exported by consumers, keep the symbol reachable
void CUSTOMER_STATUSES;
void CUSTOMER_TIERS;

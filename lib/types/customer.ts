import type { Governorate } from "./transaction";

export const CUSTOMER_TIERS = ["prepaid", "postpaid", "enterprise"] as const;
export type CustomerTier = (typeof CUSTOMER_TIERS)[number];

export const CUSTOMER_STATUSES = ["active", "suspended", "churned"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export type Customer = {
  id: string;
  msisdn: string;
  displayName: { ar: string; en: string };
  tier: CustomerTier;
  governorate: Governorate;
  joinedAt: string;
  lifetimeValueSar: number;
  status: CustomerStatus;
};

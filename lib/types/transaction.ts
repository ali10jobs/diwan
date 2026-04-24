// Kept in sync with CLAUDE.md → "Data Contracts → Transaction".
// `amountSar` is integer halalas (1 SAR = 100). Do not use floats.

export const TRANSACTION_STATUSES = ["succeeded", "failed", "pending", "reversed"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_TYPES = ["topup", "bundle", "bill", "transfer", "refund"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_CHANNELS = ["ussd", "app", "web", "pos", "ivr"] as const;
export type TransactionChannel = (typeof TRANSACTION_CHANNELS)[number];

export const GOVERNORATES = [
  "riyadh",
  "makkah",
  "eastern",
  "asir",
  "madinah",
  "qassim",
  "hail",
  "tabuk",
  "najran",
  "jazan",
  "jouf",
  "bahah",
  "northern",
] as const;
export type Governorate = (typeof GOVERNORATES)[number];

export type Transaction = {
  id: string;
  createdAt: string;
  customerId: string;
  channel: TransactionChannel;
  type: TransactionType;
  status: TransactionStatus;
  amountSar: number;
  governorate: Governorate;
  failureReason?: string;
};

import { z } from "zod";
import {
  GOVERNORATES,
  TRANSACTION_CHANNELS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from "@/lib/types/transaction";

// Single tool surface per CLAUDE.md → "Agent tool schema". The free-text
// channel cannot mutate UI state — only a validated tool call can. Any
// drift between this schema and the URL contract is caught by the URL
// query parser, not silently merged.

export const applyTransactionFilter = z.object({
  status: z.array(z.enum(TRANSACTION_STATUSES)).optional(),
  type: z.array(z.enum(TRANSACTION_TYPES)).optional(),
  channel: z.array(z.enum(TRANSACTION_CHANNELS)).optional(),
  governorate: z.array(z.enum(GOVERNORATES)).optional(),
  minAmountSar: z.number().int().nonnegative().optional(),
  maxAmountSar: z.number().int().nonnegative().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
});
export type ApplyTransactionFilter = z.infer<typeof applyTransactionFilter>;

export const TOOL_NAME = "applyTransactionFilter" as const;

export const TOOL_DESCRIPTION =
  "Apply a filter to the transactions screen. Always emit ISO-8601 dates with offset. Halalas are not used here — amounts are integer SAR. Set only the fields the user asked for; do not invent values.";

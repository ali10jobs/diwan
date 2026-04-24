import { z } from "zod";
import { GOVERNORATES } from "@/lib/types/transaction";
import {
  TRANSACTION_CHANNELS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from "@/lib/types/transaction";

// Canonical URL contract per CLAUDE.md → "URL query-param contract".
// Arrays arrive comma-separated; dates are ISO-8601. Unknown keys
// reject — any drift between URL shape and schema surfaces loudly.

const csv = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.enum(values)).min(1));

const csvLoose = z
  .string()
  .transform((s) =>
    s
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string()).min(1));

// Sort syntax: `createdAt` or `-createdAt` (prefix `-` flips direction).
type SortableField = "createdAt" | "amountSar";
const sortSchema = z
  .string()
  .regex(/^-?(createdAt|amountSar)$/)
  .transform((raw) => {
    const desc = raw.startsWith("-");
    const field = (desc ? raw.slice(1) : raw) as SortableField;
    return { field, direction: desc ? ("desc" as const) : ("asc" as const) };
  });

export const transactionsQuerySchema = z
  .object({
    status: csv(TRANSACTION_STATUSES).optional(),
    type: csv(TRANSACTION_TYPES).optional(),
    channel: csv(TRANSACTION_CHANNELS).optional(),
    // Governorate comes in as a loose list so the server can echo back
    // unknown values as "no match" rather than 422 — fixtures only use
    // a closed set, but the client's filter UI may send historical values.
    governorate: csvLoose.optional(),
    minAmount: z.coerce.number().int().nonnegative().optional(),
    maxAmount: z.coerce.number().int().nonnegative().optional(),
    dateFrom: z.string().datetime({ offset: true }).optional(),
    dateTo: z.string().datetime({ offset: true }).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(500).default(100),
    sort: sortSchema.default({ field: "createdAt", direction: "desc" }),
  })
  .strict();

export type TransactionsQuery = z.infer<typeof transactionsQuerySchema>;

/** Parse `URLSearchParams` into the typed query object. Throws `z.ZodError`
 * on malformed input — route handlers catch and return 400. */
export function parseTransactionsQuery(params: URLSearchParams): TransactionsQuery {
  const raw: Record<string, string> = {};
  for (const [k, v] of params.entries()) raw[k] = v;
  return transactionsQuerySchema.parse(raw);
}

export { GOVERNORATES };

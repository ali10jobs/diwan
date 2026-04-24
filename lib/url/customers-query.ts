import { z } from "zod";
import { CUSTOMER_STATUSES, CUSTOMER_TIERS } from "@/lib/types/customer";

// Customers query contract. Mirrors the transactions shape where
// applicable (page/pageSize/sort) and adds a free-text `q` for the
// master list's typeahead — matched case-insensitively across
// `displayName.en`, `displayName.ar`, and `msisdn`.

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

type SortableField = "joinedAt" | "lifetimeValueSar";
const sortSchema = z
  .string()
  .regex(/^-?(joinedAt|lifetimeValueSar)$/)
  .transform((raw) => {
    const desc = raw.startsWith("-");
    const field = (desc ? raw.slice(1) : raw) as SortableField;
    return { field, direction: desc ? ("desc" as const) : ("asc" as const) };
  });

export const customersQuerySchema = z
  .object({
    tier: csv(CUSTOMER_TIERS).optional(),
    status: csv(CUSTOMER_STATUSES).optional(),
    governorate: csvLoose.optional(),
    q: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(500).default(100),
    sort: sortSchema.default({ field: "joinedAt", direction: "desc" }),
  })
  .strict();

export type CustomersQuery = z.infer<typeof customersQuerySchema>;

export function parseCustomersQuery(params: URLSearchParams): CustomersQuery {
  const raw: Record<string, string> = {};
  for (const [k, v] of params.entries()) raw[k] = v;
  return customersQuerySchema.parse(raw);
}

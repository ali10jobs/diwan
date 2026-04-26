import { z } from "zod";

// Overview is a single read-only aggregate; the only knob is the
// observation window. Defaults are computed in the route handler so
// the schema can stay pure and shared client-side.

export const overviewQuerySchema = z
  .object({
    dateFrom: z.string().datetime({ offset: true }).optional(),
    dateTo: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export type OverviewQuery = z.infer<typeof overviewQuerySchema>;

export function parseOverviewQuery(params: URLSearchParams): OverviewQuery {
  const raw: Record<string, string> = {};
  for (const [k, v] of params.entries()) raw[k] = v;
  return overviewQuerySchema.parse(raw);
}

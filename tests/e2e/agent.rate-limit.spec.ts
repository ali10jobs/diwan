import { test, expect, request as pwRequest } from "@playwright/test";

// Phase 7 verification — `/api/agent` returns 429 under burst load.
// Each worker uses a unique `x-forwarded-for` so the in-memory bucket
// doesn't leak across specs (warm Fluid Compute → process-wide map).

test("burst of 25 requests from a single IP yields a 429 with localized AR message", async () => {
  const ctx = await pwRequest.newContext();
  const ip = `203.0.113.${(Math.random() * 200) | 0}`; // TEST-NET-3
  const headers = {
    "content-type": "application/json",
    "x-forwarded-for": ip,
    cookie: "diwan.locale=ar",
  };
  const body = JSON.stringify({
    messages: [
      {
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: "ping" }],
      },
    ],
  });

  // Default cap is 20/min. Fire 25 in quick succession; some after the
  // first 20 must come back as 429.
  const responses = await Promise.all(
    Array.from({ length: 25 }, () =>
      ctx.post("/api/agent", { headers, data: body, failOnStatusCode: false }),
    ),
  );
  const statuses = responses.map((r) => r.status());
  const rateLimited = responses.filter((r) => r.status() === 429);
  expect(rateLimited.length).toBeGreaterThan(0);

  // The first response that came back as 429 must carry the AR message
  // and a `retry-after` header.
  const limited = rateLimited[0]!;
  expect(limited.headers()["retry-after"]).toBeDefined();
  const json = (await limited.json()) as { error?: { code: string; message: string } };
  expect(json.error?.code).toBe("rate_limited");
  expect(json.error?.message ?? "").toContain("التمهّل");

  await ctx.dispose();
  // Sanity guard: at least one of the early requests should have made
  // it past the limiter — otherwise the cap is mis-configured.
  expect(statuses.some((s) => s !== 429)).toBe(true);
});

import { test, expect } from "@playwright/test";

// Phase 4 DoD: "/api/transactions and /api/customers respond to the
// full query contract". Hits the route handlers over HTTP so the Zod
// parsing, filter pipeline, pagination, and JSON shape are exercised
// through the same surface the UI will use.

test.describe.configure({ mode: "parallel" });
test.describe("api", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "laptop", "HTTP-only; run once on laptop");
  });

  test("GET /api/transactions — default page returns 100 items", async ({ request }) => {
    const res = await request.get("/api/transactions");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(100);
    expect(body.total).toBe(50_000);
    expect(body.items).toHaveLength(100);
    // Default sort is -createdAt: descending ISO strings.
    const ts = body.items.map((t: { createdAt: string }) => t.createdAt);
    const sorted = [...ts].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    expect(ts).toEqual(sorted);
  });

  test("GET /api/transactions — status filter narrows results", async ({ request }) => {
    const res = await request.get("/api/transactions?status=failed&pageSize=500");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
    for (const t of body.items as Array<{ status: string }>) {
      expect(t.status).toBe("failed");
    }
  });

  test("GET /api/transactions — pagination is stable", async ({ request }) => {
    const p1 = await (await request.get("/api/transactions?pageSize=25&page=1")).json();
    const p2 = await (await request.get("/api/transactions?pageSize=25&page=2")).json();
    expect(p1.items).toHaveLength(25);
    expect(p2.items).toHaveLength(25);
    const p1Ids = new Set((p1.items as Array<{ id: string }>).map((t) => t.id));
    const overlap = (p2.items as Array<{ id: string }>).filter((t) => p1Ids.has(t.id));
    expect(overlap).toEqual([]);
  });

  test("GET /api/transactions — rejects unknown query keys (400 + errorId)", async ({
    request,
  }) => {
    const res = await request.get("/api/transactions?nope=1");
    expect(res.status()).toBe(400);
    expect(res.headers()["x-error-id"]).toMatch(/^[0-9A-Z]{10}$/);
    const body = await res.json();
    expect(body.error.code).toBe("invalid_query");
    expect(body.error.errorId).toMatch(/^[0-9A-Z]{10}$/);
  });

  test("GET /api/customers — default page returns 100 items and 2000 total", async ({
    request,
  }) => {
    const res = await request.get("/api/customers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2_000);
    expect(body.items).toHaveLength(100);
    expect(body.items[0]).toHaveProperty("displayName.en");
    expect(body.items[0]).toHaveProperty("displayName.ar");
  });

  test("GET /api/customers — free-text q matches Arabic display name", async ({ request }) => {
    // One of the seeded given names is محمد — at least one customer
    // should carry it across 2k rows.
    const res = await request.get(`/api/customers?q=${encodeURIComponent("محمد")}&pageSize=500`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
  });
});

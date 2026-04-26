import { __resetRateLimitForTests, checkRateLimit } from "@/lib/ai/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => __resetRateLimitForTests());

  test("allows up to the per-minute ceiling, then blocks", () => {
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit("ip-a", 20).allowed).toBe(true);
    }
    const blocked = checkRateLimit("ip-a", 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.resetSeconds).toBeGreaterThan(0);
  });

  test("buckets are isolated by key", () => {
    for (let i = 0; i < 20; i++) checkRateLimit("ip-a", 20);
    expect(checkRateLimit("ip-a", 20).allowed).toBe(false);
    expect(checkRateLimit("ip-b", 20).allowed).toBe(true);
  });
});

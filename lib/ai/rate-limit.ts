// Best-effort token bucket keyed by IP (or session cookie fallback).
// Fluid Compute's instance reuse means a warm worker enforces rate
// limits across concurrent requests; cold starts effectively reset
// the counter, which is acceptable for a demo per CLAUDE.md.

type Bucket = { tokens: number; updatedAt: number };

const BUCKETS = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
};

export function checkRateLimit(key: string, perMinute: number): RateLimitResult {
  const now = Date.now();
  const refillRate = perMinute / 60_000; // tokens per ms
  const existing = BUCKETS.get(key);
  const tokens = existing
    ? Math.min(perMinute, existing.tokens + refillRate * (now - existing.updatedAt))
    : perMinute;

  if (tokens < 1) {
    BUCKETS.set(key, { tokens, updatedAt: now });
    const resetSeconds = Math.max(1, Math.ceil((1 - tokens) / refillRate / 1000));
    return { allowed: false, remaining: 0, resetSeconds };
  }

  BUCKETS.set(key, { tokens: tokens - 1, updatedAt: now });
  return { allowed: true, remaining: Math.floor(tokens - 1), resetSeconds: 0 };
}

/** Test helper — clears the in-memory map so specs don't leak buckets. */
export function __resetRateLimitForTests(): void {
  BUCKETS.clear();
}

import { test, expect } from "@playwright/test";

// Phase 9 — security headers per CLAUDE.md → "Security". This is a
// regression gate; CSP nonce wiring (proxy.ts) lands separately and
// is verified once Phase 11 deploys.

test("response carries strict security headers", async ({ request }) => {
  const res = await request.get("/en");
  const headers = res.headers();
  expect(headers["strict-transport-security"]).toContain("max-age=63072000");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-frame-options"]).toBe("DENY");
});

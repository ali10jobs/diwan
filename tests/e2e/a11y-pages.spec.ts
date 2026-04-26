import { test, expect } from "@playwright/test";

// Phase 8 — accessibility statement + a11y-report scaffolding render
// in both locales without crashing, even when no CI report is present.

test.describe("/accessibility", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`renders in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/accessibility`);
      const title = locale === "en" ? "Accessibility statement" : "بيان إمكانية الوصول";
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    });
  }
});

test.describe("/a11y-report", () => {
  test("EN: renders an empty state when no report file is present", async ({ page }) => {
    await page.goto("/en/a11y-report");
    await expect(
      page.getByRole("heading", { level: 1, name: "Accessibility report" }),
    ).toBeVisible();
    // No public/a11y-report.json checked into the repo by default.
    await expect(page.getByRole("status")).toBeVisible();
  });
});

test.describe("prefers-reduced-motion", () => {
  test("transitions collapse to ~0ms when the user prefers reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/en/transactions");
    await page.waitForLoadState("domcontentloaded");
    // A nav link is the most stable element to probe — it has the
    // `transition-colors` utility from Tailwind. With reduced motion
    // enforced via globals.css, computed transition-duration must be
    // effectively zero (the override clamps to 0.01ms).
    // Probe the first transition-bearing element on the page. The
    // body's `* { transition-duration: 0.01ms !important }` override
    // applies regardless of viewport, so the assertion is portable
    // across mobile and laptop projects.
    const duration = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll("a, button"));
      const el =
        candidates.find((c) => parseFloat(getComputedStyle(c).transitionDuration || "0") > 0) ??
        candidates[0];
      return el ? parseFloat(getComputedStyle(el).transitionDuration) : Infinity;
    });
    // 0.01ms === 0.00001s; allow any value below 0.005s as "effectively zero".
    expect(duration).toBeLessThan(0.005);
    await context.close();
  });
});

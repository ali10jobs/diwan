import { test, expect } from "@playwright/test";
import { expectDir, expectLang } from "./utils/rtl";

// Phase 1 DoD: `/ar` and `/en` both render with correct `<html dir>`;
// locale switch cookie persists; no layout shift on toggle (measured in Playwright).

test.describe("html direction + lang", () => {
  test("/en renders ltr + lang=en", async ({ page }) => {
    await page.goto("/en");
    await expectDir(page, "ltr");
    await expectLang(page, "en");
  });

  test("/ar renders rtl + lang=ar", async ({ page }) => {
    await page.goto("/ar");
    await expectDir(page, "rtl");
    await expectLang(page, "ar");
  });
});

test.describe("locale switch", () => {
  test("switching via the switcher persists the diwan.locale cookie", async ({ page, context }) => {
    await page.goto("/en");
    await page.locator("#locale-switch").selectOption("ar");
    await expect(page).toHaveURL(/\/ar(\/|$|\?)/);
    await expectDir(page, "rtl");

    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === "diwan.locale");
    expect(localeCookie?.value).toBe("ar");
  });
});

test.describe("no layout shift on toggle", () => {
  // Phase 1 DoD: "no layout shift on toggle (measured in Playwright)".
  // Measure Cumulative Layout Shift across the locale swap using the real
  // browser `layout-shift` entries. WCAG "Good" CLS is < 0.1; we tighten
  // further for a single-interaction swap on a near-empty shell.
  test("locale toggle triggers no layout shift", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.evaluate(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!e.hadRecentInput) {
            (window as unknown as { __cls: number }).__cls += e.value ?? 0;
          }
        }
      });
      obs.observe({ type: "layout-shift", buffered: true });
    });

    await page.locator("#locale-switch").selectOption("ar");
    await expect(page).toHaveURL(/\/ar(\/|$|\?)/);
    await expectDir(page, "rtl");
    // Settle two frames so any shift entries for the swap are flushed.
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
    );

    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls ?? 0);
    expect(cls).toBeLessThan(0.05);
  });

  test("heading stays centered in the shell across the toggle", async ({ page }) => {
    // Text content legitimately changes width between locales/fonts — we
    // assert only that the heading remains horizontally centered, which is
    // the real invariant a user would perceive as "no layout jump".
    await page.goto("/en");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    const viewportWidth = page.viewportSize()?.width ?? 1440;

    const before = await heading.boundingBox();
    await page.locator("#locale-switch").selectOption("ar");
    await expect(page).toHaveURL(/\/ar(\/|$|\?)/);
    await expectDir(page, "rtl");
    const after = await heading.boundingBox();

    const centerBefore = before!.x + before!.width / 2 - viewportWidth / 2;
    const centerAfter = after!.x + after!.width / 2 - viewportWidth / 2;
    expect(Math.abs(centerBefore)).toBeLessThanOrEqual(2);
    expect(Math.abs(centerAfter)).toBeLessThanOrEqual(2);
  });
});

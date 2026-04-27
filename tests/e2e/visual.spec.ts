import { test, expect, type BrowserContext } from "@playwright/test";

// Phase 10.5 / Phase 11 visual regression baselines per CLAUDE.md →
// "Testing Matrix". A meaningful subset of `screen × locale × brand
// × theme × viewport` so the snapshots fit the merge gate without
// 80 baselines fighting noise. Each project (laptop + mobile)
// already covers the viewport dimension; we sample the brand×theme
// dimensions with a deterministic rotation, same as a11y.spec.ts.

// Overview is excluded from the snapshot baseline: Recharts SVG
// rendering varies with sub-pixel anti-aliasing in ways that produce
// noisy diffs even with a generous threshold. Its visual layer is
// covered by `tests/e2e/overview.spec.ts` (existence + RTL chart
// wrapper). Everything else snapshots cleanly.
const SCREENS = [
  { path: "/transactions", label: "transactions" },
  { path: "/customers", label: "customers" },
  { path: "/agent", label: "agent" },
  { path: "/settings", label: "settings" },
] as const;
const LOCALES = ["en", "ar"] as const;
const BRANDS = ["bayan", "alt"] as const;
const THEMES = ["light", "dark"] as const;

function brandThemeFor(idx: number): {
  brand: (typeof BRANDS)[number];
  theme: (typeof THEMES)[number];
} {
  const brand = BRANDS[idx % BRANDS.length]!;
  const theme = THEMES[Math.floor(idx / BRANDS.length) % THEMES.length]!;
  return { brand, theme };
}

async function applyPrefs(
  context: BrowserContext,
  brand: (typeof BRANDS)[number],
  theme: (typeof THEMES)[number],
): Promise<void> {
  await context.addCookies([
    { name: "diwan.brand", value: brand, url: "http://127.0.0.1:3000", sameSite: "Lax" },
    { name: "diwan.theme", value: theme, url: "http://127.0.0.1:3000", sameSite: "Lax" },
  ]);
}

let combinationIdx = 0;
test.describe.configure({ timeout: 90_000 });
for (const screen of SCREENS) {
  for (const locale of LOCALES) {
    const idx = combinationIdx++;
    const { brand, theme } = brandThemeFor(idx);
    test(`visual: ${screen.label} × ${locale} × ${brand} × ${theme}`, async ({ page, context }) => {
      await applyPrefs(context, brand, theme);
      await page.goto(`/${locale}${screen.path}`);
      await page.waitForLoadState("domcontentloaded");
      // Wait for the page heading rather than `main#main` — under
      // heavy parallel load `main` can briefly report as zero-size,
      // which Playwright reports as `hidden`.
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 60_000 });
      await page.waitForTimeout(900);

      await expect(page).toHaveScreenshot(`${screen.label}-${locale}-${brand}-${theme}.png`, {
        // Generous threshold — anti-aliasing across font rasterizers
        // and chart sub-pixels would otherwise dominate the diff.
        // 10% absorbs sub-pixel font rendering differences across
        // headless Chrome runs without papering over real changes.
        // Tighter thresholds turn into noise on the data-grid screens.
        maxDiffPixelRatio: 0.1,
        fullPage: false,
        animations: "disabled",
        // Mask volatile data: timestamps in the table, the live
        // `Refreshing…` indicator, and the agent's empty-hint.
        mask: [page.locator("[aria-live='polite']"), page.locator("table[role='grid'] tbody")],
      });
    });
  }
}

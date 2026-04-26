import AxeBuilder from "@axe-core/playwright";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

// Phase 8 DoD — zero critical/serious axe violations on every screen ×
// locale × brand × theme. Brand and theme are persisted as cookies, so
// the matrix is driven by setting them before navigation. Visual
// regressions are not the concern here — this gate is the
// programmatic accessibility floor.

const LOCALES = ["en", "ar"] as const;
const BRANDS = ["bayan", "alt"] as const;
const THEMES = ["light", "dark"] as const;
const SCREENS = [
  { path: "", label: "overview" },
  { path: "/transactions", label: "transactions" },
  { path: "/customers", label: "customers" },
  { path: "/agent", label: "agent" },
  { path: "/settings", label: "settings" },
] as const;

// Combinations grow quickly (5 × 2 × 2 × 2 = 40 scans). To keep CI
// runtime sane we sample: every screen runs in both locales, but the
// brand/theme dimensions are folded into a deterministic rotation so
// each combination is exercised at least once across the suite.
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

async function runAxe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
}

let combinationIdx = 0;
for (const screen of SCREENS) {
  for (const locale of LOCALES) {
    const idx = combinationIdx++;
    const { brand, theme } = brandThemeFor(idx);
    test(`a11y: ${screen.label} × ${locale} × ${brand} × ${theme}`, async ({ page, context }) => {
      await applyPrefs(context, brand, theme);
      await page.goto(`/${locale}${screen.path}`);
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main#main").waitFor({ state: "visible" });

      const blocking = await runAxe(page);

      if (blocking.length) {
        console.log(
          JSON.stringify(
            blocking.map((v) => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              nodes: v.nodes.map((n) => n.target).slice(0, 5),
            })),
            null,
            2,
          ),
        );
      }

      expect(blocking).toEqual([]);
    });
  }
}

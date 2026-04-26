import AxeBuilder from "@axe-core/playwright";
import { test, expect, type BrowserContext } from "@playwright/test";

// Phase 8 DoD — "WCAG 2.1 AA contrast verified explicitly on both
// themes × both brands (4 combinations per screen)". The general
// a11y.spec.ts samples the brand × theme dimensions to keep the
// matrix small; this spec runs the contrast check ONLY but at the
// full cross-product so a contrast regression on, say,
// `alt × dark × overview` cannot slip through a sampled run.

const SCREENS = [
  { path: "", label: "overview" },
  { path: "/transactions", label: "transactions" },
  { path: "/customers", label: "customers" },
  { path: "/agent", label: "agent" },
  { path: "/settings", label: "settings" },
] as const;
const BRANDS = ["bayan", "alt"] as const;
const THEMES = ["light", "dark"] as const;

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

for (const screen of SCREENS) {
  for (const brand of BRANDS) {
    for (const theme of THEMES) {
      test(`contrast AA: ${screen.label} × ${brand} × ${theme}`, async ({ page, context }) => {
        await applyPrefs(context, brand, theme);
        await page.goto(`/en${screen.path}`);
        await page.waitForLoadState("domcontentloaded");
        await page.locator("main#main").waitFor({ state: "visible" });

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2aa"])
          .options({ runOnly: { type: "rule", values: ["color-contrast"] } })
          .analyze();

        const fails = results.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        );
        if (fails.length) {
          console.log(
            JSON.stringify(
              fails.map((v) => ({
                id: v.id,
                impact: v.impact,
                nodes: v.nodes.map((n) => ({ target: n.target, html: n.html.slice(0, 120) })),
              })),
              null,
              2,
            ),
          );
        }
        expect(fails).toEqual([]);
      });
    }
  }
}

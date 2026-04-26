import { test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { promises as fs } from "node:fs";
import path from "node:path";

// Producer for `public/a11y-report.json`. Run with:
//
//   pnpm a11y:report
//
// This file lives outside `tests/e2e` so the normal e2e suite doesn't
// pick it up — it has side effects (writes a JSON artifact) and would
// only ever run on demand or from CI.

type Impact = "minor" | "moderate" | "serious" | "critical" | null;

type Violation = {
  id: string;
  impact: Impact;
  help: string;
  helpUrl?: string;
  nodes: number;
};

type ScreenResult = {
  screen: string;
  locale: "ar" | "en";
  brand: string;
  theme: string;
  passes: number;
  violations: Violation[];
};

const SCREENS = [
  { path: "", label: "overview" },
  { path: "/transactions", label: "transactions" },
  { path: "/customers", label: "customers" },
  { path: "/agent", label: "agent" },
  { path: "/settings", label: "settings" },
] as const;
const LOCALES = ["en", "ar"] as const;
const BRANDS = ["bayan", "alt"] as const;
const THEMES = ["light", "dark"] as const;

test.describe.configure({ mode: "serial" });

test("build a11y report", async ({ browser }) => {
  test.setTimeout(180_000);
  const out: ScreenResult[] = [];

  for (const screen of SCREENS) {
    for (const locale of LOCALES) {
      for (const brand of BRANDS) {
        for (const theme of THEMES) {
          const ctx = await browser.newContext();
          await ctx.addCookies([
            { name: "diwan.brand", value: brand, url: "http://127.0.0.1:3000", sameSite: "Lax" },
            { name: "diwan.theme", value: theme, url: "http://127.0.0.1:3000", sameSite: "Lax" },
          ]);
          const page = await ctx.newPage();
          await page.goto(`http://127.0.0.1:3000/${locale}${screen.path}`);
          await page.waitForLoadState("domcontentloaded");
          await page.locator("main#main").waitFor({ state: "visible" });

          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze();

          out.push({
            screen: screen.label,
            locale,
            brand,
            theme,
            passes: results.passes.length,
            violations: results.violations.map((v) => ({
              id: v.id,
              impact: (v.impact ?? null) as Impact,
              help: v.help,
              helpUrl: v.helpUrl,
              nodes: v.nodes.length,
            })),
          });

          await ctx.close();
        }
      }
    }
  }

  const allViolations = out.flatMap((s) => s.violations);
  const summary = {
    blocking: allViolations.filter((v) => v.impact === "critical" || v.impact === "serious").length,
    moderate: allViolations.filter((v) => v.impact === "moderate").length,
    minor: allViolations.filter((v) => v.impact === "minor").length,
    cleanScreens: out.filter((s) => s.violations.length === 0).length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    axeVersion: undefined as string | undefined,
    screens: out,
    summary,
  };

  const target = path.join(process.cwd(), "public", "a11y-report.json");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(report, null, 2));
  console.log(`a11y-report written: ${target}`);
  console.log(`  combinations: ${out.length}`);
  console.log(`  blocking:     ${summary.blocking}`);
  console.log(`  moderate:     ${summary.moderate}`);
  console.log(`  minor:        ${summary.minor}`);
  console.log(`  clean:        ${summary.cleanScreens}/${out.length}`);
});

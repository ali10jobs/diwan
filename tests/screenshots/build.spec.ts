import { test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";

// Producer for `public/screenshots/*.png`. Walks the 5 × 2 × 2 matrix
// (screen × locale × brand) at the laptop viewport and writes PNGs the
// README references. Run with:
//
//   pnpm screenshots
//
// Lives outside `tests/e2e` so the regular suite doesn't pick it up —
// it has side effects (writes files) and is on-demand.

const SCREENS = [
  { path: "", label: "overview" },
  { path: "/transactions", label: "transactions" },
  { path: "/customers", label: "customers" },
  { path: "/agent", label: "agent" },
  { path: "/settings", label: "settings" },
] as const;
const LOCALES = ["en", "ar"] as const;
const BRANDS = ["bayan", "alt"] as const;

test.describe.configure({ mode: "serial" });

test("capture portfolio screenshots", async ({ browser }) => {
  test.setTimeout(180_000);
  const out = path.join(process.cwd(), "public", "screenshots");
  await fs.mkdir(out, { recursive: true });

  for (const screen of SCREENS) {
    for (const locale of LOCALES) {
      for (const brand of BRANDS) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        await ctx.addCookies([
          { name: "diwan.brand", value: brand, url: "http://127.0.0.1:3000", sameSite: "Lax" },
          { name: "diwan.theme", value: "light", url: "http://127.0.0.1:3000", sameSite: "Lax" },
        ]);
        const page = await ctx.newPage();
        await page.goto(`http://127.0.0.1:3000/${locale}${screen.path}`);
        await page.waitForLoadState("domcontentloaded");
        await page.locator("main#main").waitFor({ state: "visible" });
        // Settle data-bound screens — the CSV export anchor and the
        // first table row are stable signals that data has rendered.
        await page.waitForTimeout(800);

        const file = path.join(out, `${screen.label}-${locale}-${brand}.png`);
        await page.screenshot({ path: file, fullPage: false });
        console.log(`wrote ${path.relative(process.cwd(), file)}`);
        await ctx.close();
      }
    }
  }
});

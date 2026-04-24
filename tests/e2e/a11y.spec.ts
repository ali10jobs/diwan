import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

// Phase 3 DoD: "axe clean on shell". Phase 8 will extend this across
// every screen × locale × brand × theme and make it the merge gate —
// for now we apply the zero critical/serious rule to the shell only.

for (const locale of ["en", "ar"] as const) {
  test(`shell is axe-clean (${locale}, no critical/serious)`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await page.waitForLoadState("domcontentloaded");
    // Ensure the shell's main landmark has rendered before axe scans.
    await page.locator("main#main").waitFor({ state: "visible" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    // Helpful dump when it fails — surfaces rule id + nodes in the report.
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

import { test, expect } from "@playwright/test";

// Phase 3 DoD: "Sidebar flips side with direction; keyboard traversal
// hits every nav item in reading order; skip-link works; focus ring
// visible on all interactive elements; mobile drawer traps focus."

test.describe("app shell — desktop (laptop project)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "laptop", "desktop-only layout");
  });

  test("skip link is the first focus stop and targets #main", async ({ page }) => {
    await page.goto("/en");
    await page.keyboard.press("Tab");
    const skip = page.locator("a:focus");
    await expect(skip).toHaveAttribute("href", "#main");
    // Activating it moves focus onto the main region.
    await skip.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("sidebar is on the inline-start edge in LTR", async ({ page }) => {
    await page.goto("/en");
    const sidebar = page.getByRole("complementary");
    const main = page.locator("main#main");
    const [sRect, mRect] = await Promise.all([sidebar.boundingBox(), main.boundingBox()]);
    expect(sRect).not.toBeNull();
    expect(mRect).not.toBeNull();
    // Sidebar's left edge < main's left edge (sidebar is to the left in LTR).
    expect(sRect!.x).toBeLessThan(mRect!.x);
  });

  test("sidebar flips to the inline-start edge (right) in RTL", async ({ page }) => {
    await page.goto("/ar");
    const sidebar = page.getByRole("complementary");
    const main = page.locator("main#main");
    const [sRect, mRect] = await Promise.all([sidebar.boundingBox(), main.boundingBox()]);
    // In RTL, sidebar should be to the right of main (higher x).
    expect(sRect!.x).toBeGreaterThan(mRect!.x);
  });

  test("active nav item carries aria-current=page", async ({ page }) => {
    await page.goto("/en");
    // The Overview link points to `/en` (the root). It should be active
    // on the home page.
    const activeItems = page.locator('[aria-current="page"]');
    await expect(activeItems).toHaveCount(1);
    await expect(activeItems).toContainText(/Overview/i);
  });

  test("keyboard traversal reaches every nav item in reading order", async ({ page }) => {
    // Phase 3 DoD: "keyboard traversal hits every nav item in reading
    // order". Start unfocused, then Tab until each nav label appears on
    // the active element — Tab up to 40 times to clear the skip link,
    // topbar switchers, etc.
    await page.goto("/en");
    await page.locator("body").click({ position: { x: 1, y: 1 } });

    const expected = ["Overview", "Transactions", "Customers", "Agent", "Settings"];
    const seen: string[] = [];

    for (let i = 0; i < 40 && seen.length < expected.length; i++) {
      await page.keyboard.press("Tab");
      const label = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? "",
      );
      const next = expected[seen.length];
      if (next && label.includes(next)) seen.push(next);
    }

    expect(seen).toEqual(expected);
  });
});

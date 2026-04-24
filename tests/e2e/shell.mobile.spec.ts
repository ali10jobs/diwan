import { test, expect } from "@playwright/test";

// Phase 3 DoD: "mobile drawer traps focus".
// Runs only on the `mobile` project — the hamburger trigger is
// hidden `lg:hidden`, so on laptop viewport the trigger doesn't exist.

test.describe("mobile drawer", () => {
  test("hamburger opens the drawer and focus is trapped inside", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile project only");
    await page.goto("/en");
    await page.getByRole("button", { name: /open navigation/i }).click();

    // Drawer is a Radix Dialog — it renders with role="dialog" and
    // traps focus via FocusScope. Radix doesn't emit `aria-modal="true"`
    // on Content (it relies on the focus trap + inert backdrop for
    // semantics), so we only assert the dialog mounts and focus stays
    // inside it below.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Tab a handful of times and confirm focus stays within the drawer.
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const focusedInDialog = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(focusedInDialog).toBe(true);
    }

    // Escape dismisses the drawer.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

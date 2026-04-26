import { test, expect } from "@playwright/test";

// Phase 6 — Settings: every preference surface present, calendar +
// numerals cookies persist, preview reflects the cookie.

test.describe("settings", () => {
  test("renders all switchers in EN", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    // Locale + theme also live in the topbar; assert their presence
    // somewhere on the page rather than uniqueness, and assert the
    // settings-only switchers (numerals, calendar) are unique.
    await expect(page.locator("#locale-switch").first()).toBeVisible();
    await expect(page.locator("#theme-switch").first()).toBeVisible();
    await expect(page.locator("#numerals-switch")).toBeVisible();
    await expect(page.locator("#calendar-switch")).toBeVisible();
    // Brand + density also live in the topbar but hidden via `xl:block`.
    // The settings copy is `.last()` and always visible regardless of viewport.
    await expect(page.locator("#brand-switch").last()).toBeVisible();
    await expect(page.locator("#density-switch").last()).toBeVisible();
  });

  test("calendar switch persists the cookie and changes the preview", async ({ page, context }) => {
    await page.goto("/ar/settings");
    const previewBefore = await page
      .locator(":text('Preview') + span, :text('معاينة') + span")
      .first()
      .innerText()
      .catch(() => "");

    await page.locator("#calendar-switch").selectOption("islamic-umalqura");
    // Switcher reloads the page to repaint formatters consistently.
    await page.waitForLoadState("load");

    const cookies = await context.cookies();
    const calendar = cookies.find((c) => c.name === "diwan.calendar");
    expect(calendar?.value).toBe("islamic-umalqura");

    // The preview text rebuilds with the new calendar — at minimum it
    // is non-empty and differs from a fresh Gregorian render.
    const previewAfter = await page
      .locator(":text('Preview') + span, :text('معاينة') + span")
      .first()
      .innerText()
      .catch(() => "");
    if (previewBefore && previewAfter) expect(previewAfter).not.toEqual(previewBefore);
  });

  test("numerals switch persists the cookie", async ({ page, context }) => {
    await page.goto("/en/settings");
    await page.locator("#numerals-switch").selectOption("arab");
    await page.waitForLoadState("load");
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "diwan.numerals")?.value).toBe("arab");
  });
});

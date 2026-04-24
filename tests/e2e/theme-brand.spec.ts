import { test, expect } from "@playwright/test";

// Phase 2 DoD: "brand swap AND theme swap (light/dark/system) work at
// runtime with no reload and no FOUC."

test.describe("brand + theme runtime swap", () => {
  test("brand swap updates data-brand and primary color without reload", async ({ page }) => {
    await page.goto("/en");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-brand", "bayan");

    const getPrimary = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim(),
      );
    const bayanPrimary = await getPrimary();

    // Track navigations; there must be none across the brand swap.
    let navigated = false;
    page.on("framenavigated", () => {
      navigated = true;
    });

    await page.locator("#brand-switch").selectOption("alt");
    await expect(html).toHaveAttribute("data-brand", "alt");

    const altPrimary = await getPrimary();
    expect(altPrimary).not.toEqual(bayanPrimary);
    expect(navigated).toBe(false);

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "diwan.brand")?.value).toBe("alt");
  });

  test("theme swap flips data-theme and bg color without reload", async ({ page }) => {
    await page.goto("/en");
    const html = page.locator("html");

    const getBg = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim(),
      );

    await page.locator("#theme-switch").selectOption("light");
    await expect(html).toHaveAttribute("data-theme", "light");
    const lightBg = await getBg();

    await page.locator("#theme-switch").selectOption("dark");
    await expect(html).toHaveAttribute("data-theme", "dark");
    const darkBg = await getBg();

    expect(lightBg).not.toEqual(darkBg);
  });

  test("no FOUC: data-theme is present on the first paint", async ({ page }) => {
    // Seed a concrete preference so the inline NoFoucScript path isn't the
    // only one exercised — this variant relies on the SSR attribute.
    await page
      .context()
      .addCookies([{ name: "diwan.theme", value: "dark", url: "http://127.0.0.1:3000" }]);
    const response = await page.goto("/en");
    const html = (await response?.text()) ?? "";
    // The attribute must exist in the HTML the server sent, not be added
    // by a post-hydration effect — that's the FOUC guarantee.
    expect(html).toMatch(/<html[^>]*\sdata-theme="dark"/);
  });
});

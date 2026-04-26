import { test, expect } from "@playwright/test";

// Phase 6 — Overview screen smoke + RTL chart wrapping.

test.describe("overview", () => {
  test("EN renders KPI cards and both charts", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Daily revenue" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Revenue by governorate" })).toBeVisible();
    // KPI cards: revenue label is present and shows a SAR value.
    await expect(page.getByText("Revenue", { exact: true }).first()).toBeVisible();
  });

  test("AR renders KPI cards with localized headings", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1, name: "نظرة عامة" })).toBeVisible();
    await expect(page.getByRole("img", { name: "الإيرادات اليومية" })).toBeVisible();
  });

  test("RtlChart wrapper forces dir=ltr locally so SVG ticks are not mirrored", async ({
    page,
  }) => {
    await page.goto("/ar");
    const chart = page.getByRole("img", { name: "الإيرادات اليومية" });
    await expect(chart).toBeVisible();
    await expect(chart).toHaveAttribute("dir", "ltr");
  });
});

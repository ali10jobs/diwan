import { test, expect } from "@playwright/test";

// Phase 6 — Customers screen: list + detail render, search filters,
// detail picks first row by default.

test.describe("customers", () => {
  test("renders master list and detail in EN", async ({ page }) => {
    await page.goto("/en/customers");
    await expect(page.getByRole("heading", { level: 1, name: "Customers" })).toBeVisible();
    await expect(page.getByRole("listbox", { name: "Customer list" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Customer details" })).toBeVisible();
    // The detail pane has a status field — confirms a customer was auto-selected.
    await expect(page.getByText("Status", { exact: true }).first()).toBeVisible();
  });

  test("clicking a row updates the detail pane", async ({ page }) => {
    await page.goto("/en/customers");
    const list = page.getByRole("listbox", { name: "Customer list" });
    const firstHeading = await page
      .getByRole("region", { name: "Customer details" })
      .getByRole("heading", { level: 2 })
      .innerText();

    // Pick a row that's *not* the first one — text guarantees a different name.
    const options = list.getByRole("option");
    await expect(options.first()).toBeVisible();
    await options.nth(3).click();

    const newHeading = await page
      .getByRole("region", { name: "Customer details" })
      .getByRole("heading", { level: 2 })
      .innerText();
    expect(newHeading).not.toEqual(firstHeading);
  });

  test("AR locale renders detail labels in Arabic", async ({ page }) => {
    await page.goto("/ar/customers");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1, name: "العملاء" })).toBeVisible();
    await expect(page.getByText("الحالة", { exact: true }).first()).toBeVisible();
  });
});

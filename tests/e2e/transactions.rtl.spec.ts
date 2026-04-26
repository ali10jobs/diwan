import { test, expect, type Page } from "@playwright/test";
import { expectDir } from "./utils/rtl";

// Phase 5 DoD — "RTL column order correct".
// The transactions grid declares columns in a fixed logical order
// (id → createdAt → type → channel → status → governorate → amountSar).
// In LTR the visual order matches; in RTL the same logical order must
// flip on screen via the inherited `<html dir>` — no manual CSS hacks.

const EXPECTED_HEADERS_EN = ["ID", "Date", "Type", "Channel", "Status", "Region", "Amount"];
const EXPECTED_HEADERS_AR = [
  "المعرّف",
  "التاريخ",
  "النوع",
  "القناة",
  "الحالة",
  "المنطقة",
  "المبلغ",
];

async function readHeaderOrderByX(page: Page): Promise<string[]> {
  const headers = page.locator('table[role="grid"] thead th');
  const count = await headers.count();
  const items: { x: number; text: string }[] = [];
  for (let i = 0; i < count; i++) {
    const th = headers.nth(i);
    const box = await th.boundingBox();
    const text = (await th.innerText()).trim().split("\n")[0]!.trim();
    if (box) items.push({ x: box.x, text });
  }
  return items.sort((a, b) => a.x - b.x).map((i) => i.text);
}

test.describe("transactions grid — RTL column order", () => {
  test("EN reads left → right in declared column order", async ({ page }) => {
    await page.goto("/en/transactions");
    await expectDir(page, "ltr");
    await expect(page.locator('table[role="grid"]')).toBeVisible();
    await expect(page.locator('table[role="grid"] tbody tr').first()).toBeVisible();

    const visualOrder = await readHeaderOrderByX(page);
    expect(visualOrder).toEqual(EXPECTED_HEADERS_EN);
  });

  test("AR reads right → left — same logical order, mirrored visually", async ({ page }) => {
    await page.goto("/ar/transactions");
    await expectDir(page, "rtl");
    await expect(page.locator('table[role="grid"]')).toBeVisible();
    await expect(page.locator('table[role="grid"] tbody tr').first()).toBeVisible();

    const visualOrderLeftToRight = await readHeaderOrderByX(page);
    // RTL: the declared first column ("ID") appears on the right of the
    // viewport, so reading by x-coordinate yields the reversed list.
    expect(visualOrderLeftToRight).toEqual([...EXPECTED_HEADERS_AR].reverse());
  });
});

import { expect, type Locator, type Page } from "@playwright/test";

// Shared RTL assertion helpers — see CLAUDE.md → "Playwright RTL Assertion Utilities".
// Expand as Phase 5 grids land; keep every RTL assertion going through here so
// the definitions stay consistent across specs.

export async function expectDir(page: Page, expected: "rtl" | "ltr"): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("dir", expected);
}

export async function expectLang(page: Page, expected: string): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("lang", expected);
}

/**
 * Assert the visual inline-start edge of `locator` relative to its offset
 * parent. In LTR, inline-start = left edge ≈ 0; in RTL, inline-start = right
 * edge ≈ parent width. Callers pass the direction they expect so the helper
 * flips the comparison.
 */
export async function expectInlineStart(locator: Locator, direction: "ltr" | "rtl"): Promise<void> {
  const { childLeft, parentRight } = await locator.evaluate((el) => {
    const child = el.getBoundingClientRect();
    const parentEl = (el.parentElement ?? el) as HTMLElement;
    const parent = parentEl.getBoundingClientRect();
    return {
      childLeft: child.left - parent.left,
      parentRight: parent.right - child.right,
    };
  });
  if (direction === "ltr") {
    expect(childLeft).toBeLessThan(parentRight);
  } else {
    expect(parentRight).toBeLessThan(childLeft);
  }
}

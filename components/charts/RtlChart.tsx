"use client";

import { useLocale } from "next-intl";
import { localeDirection, type Locale } from "@/lib/i18n/config";

/**
 * Phase 6 — direction-aware chart wrapper.
 *
 * Recharts has no built-in RTL mode: in `dir="rtl"` SVG text mirrors
 * but axis order doesn't, so X-axis labels read backwards and the
 * tooltip anchors on the wrong inline edge. The fix per CLAUDE.md is
 * a wrapper that:
 *
 *   - Exposes `isRtl`, `xAxisProps`, `tooltipPosition` so consumers
 *     pass them straight through to the Recharts primitives. We avoid
 *     wrapping <ResponsiveContainer> itself — the chart composition
 *     belongs to the consumer; this is just direction plumbing.
 *   - Forces the SVG into LTR locally so axis tick text isn't mirrored
 *     by the parent RTL document — the `reversed` axis flips the data
 *     order instead, which is the correct "right-to-left reading"
 *     behavior on a numeric/time axis.
 */
export function useRtlChart(): {
  isRtl: boolean;
  /** Spread onto `<XAxis>` to flip data order in RTL. */
  xAxisProps: { reversed?: true };
  /** Default tooltip placement so it anchors to the inline-end edge. */
  tooltipPlacement: "left" | "right";
} {
  const locale = useLocale() as Locale;
  const isRtl = localeDirection[locale] === "rtl";
  return {
    isRtl,
    xAxisProps: isRtl ? { reversed: true } : {},
    tooltipPlacement: isRtl ? "left" : "right",
  };
}

/**
 * Bounded chart container — fixed height so SSR matches CSR (no CLS),
 * `dir="ltr"` so SVG tick labels are not mirrored by the document.
 * Numbers and dates inside ticks remain readable; the data order is
 * what flips, via `xAxisProps`.
 */
export function RtlChart({
  height = 280,
  children,
  ariaLabel,
}: {
  height?: number;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div role="img" aria-label={ariaLabel} dir="ltr" className="w-full" style={{ height }}>
      {children}
    </div>
  );
}

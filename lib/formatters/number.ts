import type { Locale, NumeralSystem } from "@/lib/i18n/config";
import { buildLocaleTag } from "./numerals";

export function formatNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions & { numerals?: NumeralSystem } = {},
): string {
  const { numerals = "auto", ...rest } = options;
  return new Intl.NumberFormat(buildLocaleTag(locale, numerals), rest).format(value);
}

export function formatPercent(value: number, locale: Locale, numerals: NumeralSystem = "auto") {
  return formatNumber(value, locale, {
    numerals,
    style: "percent",
    maximumFractionDigits: 1,
  });
}

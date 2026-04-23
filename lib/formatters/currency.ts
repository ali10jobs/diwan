import type { Locale, NumeralSystem } from "@/lib/i18n/config";
import { buildLocaleTag } from "./numerals";

// amountHalalas: integer halalas (1 SAR = 100 halalas) per the Transaction contract.
export function formatSar(
  amountHalalas: number,
  locale: Locale,
  numerals: NumeralSystem = "auto",
): string {
  const value = amountHalalas / 100;
  return new Intl.NumberFormat(buildLocaleTag(locale, numerals), {
    style: "currency",
    currency: "SAR",
    currencyDisplay: locale === "ar" ? "symbol" : "code",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

import type { Locale, NumeralSystem } from "@/lib/i18n/config";

export function resolveNumberingSystem(locale: Locale, preference: NumeralSystem): "latn" | "arab" {
  if (preference === "arab") return "arab";
  if (preference === "latn") return "latn";
  return locale === "ar" ? "arab" : "latn";
}

export function buildLocaleTag(locale: Locale, preference: NumeralSystem): string {
  const ns = resolveNumberingSystem(locale, preference);
  const base = locale === "ar" ? "ar-SA" : "en-US";
  return `${base}-u-nu-${ns}`;
}

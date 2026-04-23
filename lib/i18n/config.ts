export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

export const LOCALE_COOKIE = "diwan.locale";
export const NUMERALS_COOKIE = "diwan.numerals";

export type NumeralSystem = "auto" | "arab" | "latn";
export const defaultNumerals: NumeralSystem = "auto";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function isNumeralSystem(value: string | undefined | null): value is NumeralSystem {
  return value === "auto" || value === "arab" || value === "latn";
}

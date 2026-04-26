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
export const CALENDAR_COOKIE = "diwan.calendar";

export type NumeralSystem = "auto" | "arab" | "latn";
export const defaultNumerals: NumeralSystem = "auto";

export const calendars = ["gregory", "islamic-umalqura"] as const;
export type CalendarPreference = (typeof calendars)[number];
export const defaultCalendar: CalendarPreference = "gregory";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function isNumeralSystem(value: string | undefined | null): value is NumeralSystem {
  return value === "auto" || value === "arab" || value === "latn";
}

export function isCalendar(value: string | undefined | null): value is CalendarPreference {
  return value === "gregory" || value === "islamic-umalqura";
}

import type { Locale, NumeralSystem } from "@/lib/i18n/config";
import { buildLocaleTag } from "./numerals";

export type CalendarSystem = "gregory" | "islamic-umalqura";

export function formatDate(
  date: Date | string | number,
  locale: Locale,
  options: {
    calendar?: CalendarSystem;
    numerals?: NumeralSystem;
    dateStyle?: "full" | "long" | "medium" | "short";
    timeStyle?: "full" | "long" | "medium" | "short";
  } = {},
): string {
  const { calendar = "gregory", numerals = "auto", dateStyle = "medium", timeStyle } = options;
  const tag = `${buildLocaleTag(locale, numerals)}-ca-${calendar}`;
  const formatOptions: Intl.DateTimeFormatOptions = { dateStyle };
  if (timeStyle) formatOptions.timeStyle = timeStyle;
  const value = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(tag, formatOptions).format(value);
}

import { cookies } from "next/headers";
import {
  CALENDAR_COOKIE,
  type CalendarPreference,
  defaultCalendar,
  defaultNumerals,
  isCalendar,
  isNumeralSystem,
  NUMERALS_COOKIE,
  type NumeralSystem,
} from "./config";

export async function readNumeralsCookie(): Promise<NumeralSystem> {
  const jar = await cookies();
  const value = jar.get(NUMERALS_COOKIE)?.value;
  return isNumeralSystem(value) ? value : defaultNumerals;
}

export async function readCalendarCookie(): Promise<CalendarPreference> {
  const jar = await cookies();
  const value = jar.get(CALENDAR_COOKIE)?.value;
  return isCalendar(value) ? value : defaultCalendar;
}

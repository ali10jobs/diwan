"use client";

import { useTransition } from "react";
import { CALENDAR_COOKIE, calendars, type CalendarPreference } from "@/lib/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function CalendarSwitcher({
  label,
  current,
  labels,
}: {
  label: string;
  current: CalendarPreference;
  labels: Record<CalendarPreference, string>;
}) {
  const [isPending, startTransition] = useTransition();

  const onChange = (next: CalendarPreference) => {
    document.cookie = `${CALENDAR_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
    startTransition(() => {
      window.location.reload();
    });
  };

  return (
    <div className="inline-flex items-center gap-2" aria-busy={isPending}>
      <label htmlFor="calendar-switch" className="text-sm text-[color:var(--color-fg-muted)]">
        {label}
      </label>
      <select
        id="calendar-switch"
        defaultValue={current}
        onChange={(e) => onChange(e.target.value as CalendarPreference)}
        disabled={isPending}
        className="h-11 min-w-[12rem] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:opacity-60"
      >
        {calendars.map((c) => (
          <option key={c} value={c}>
            {labels[c]}
          </option>
        ))}
      </select>
    </div>
  );
}

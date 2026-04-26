"use client";

import { useTransition } from "react";
import { NUMERALS_COOKIE, type NumeralSystem } from "@/lib/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

const VALUES: NumeralSystem[] = ["auto", "arab", "latn"];

export function NumeralSwitcher({
  label,
  current,
  labels,
}: {
  label: string;
  current: NumeralSystem;
  labels: Record<NumeralSystem, string>;
}) {
  const [isPending, startTransition] = useTransition();

  const onChange = (next: NumeralSystem) => {
    document.cookie = `${NUMERALS_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
    // Numerals cascade through every formatter (currency, date, table
    // cells); a soft reload is the cheapest way to repaint everything
    // consistently without rebuilding a global numeral context.
    startTransition(() => {
      window.location.reload();
    });
  };

  return (
    <div className="inline-flex items-center gap-2" aria-busy={isPending}>
      <label htmlFor="numerals-switch" className="text-sm text-[color:var(--color-fg-muted)]">
        {label}
      </label>
      <select
        id="numerals-switch"
        defaultValue={current}
        onChange={(e) => onChange(e.target.value as NumeralSystem)}
        disabled={isPending}
        className="h-11 min-w-[9rem] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:opacity-60"
      >
        {VALUES.map((v) => (
          <option key={v} value={v}>
            {labels[v]}
          </option>
        ))}
      </select>
    </div>
  );
}

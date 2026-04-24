"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { themes, type ThemeMode } from "@/lib/theme/config";

export function ThemeSwitcher({
  label,
  labels,
}: {
  label: string;
  labels: Record<ThemeMode, string>;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-2">
      <label htmlFor="theme-switch" className="text-sm text-[color:var(--color-fg-muted)]">
        {label}
      </label>
      <select
        id="theme-switch"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeMode)}
        className="h-11 min-w-[9rem] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
      >
        {themes.map((t) => (
          <option key={t} value={t}>
            {labels[t]}
          </option>
        ))}
      </select>
    </div>
  );
}

"use client";

import { useDensity } from "@/components/theme/DensityProvider";
import { densities, type Density } from "@/lib/theme/config";

export function DensitySwitcher({
  label,
  labels,
}: {
  label: string;
  labels: Record<Density, string>;
}) {
  const { density, setDensity } = useDensity();
  return (
    <div className="inline-flex items-center gap-2">
      <label htmlFor="density-switch" className="text-sm text-[color:var(--color-fg-muted)]">
        {label}
      </label>
      <select
        id="density-switch"
        value={density}
        onChange={(e) => setDensity(e.target.value as Density)}
        className="h-11 min-w-[9rem] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 text-sm text-[color:var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
      >
        {densities.map((d) => (
          <option key={d} value={d}>
            {labels[d]}
          </option>
        ))}
      </select>
    </div>
  );
}

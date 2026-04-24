"use client";

import { useBrand } from "@/components/theme/BrandProvider";
import { brandLabels, brands, type Brand } from "@/lib/theme/config";

export function BrandSwitcher({ label }: { label: string }) {
  const { brand, setBrand } = useBrand();
  return (
    <div className="inline-flex items-center gap-2">
      <label htmlFor="brand-switch" className="text-sm text-[color:var(--color-fg-muted)]">
        {label}
      </label>
      <select
        id="brand-switch"
        value={brand}
        onChange={(e) => setBrand(e.target.value as Brand)}
        className="h-11 min-w-[9rem] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
      >
        {brands.map((b) => (
          <option key={b} value={b}>
            {brandLabels[b]}
          </option>
        ))}
      </select>
    </div>
  );
}

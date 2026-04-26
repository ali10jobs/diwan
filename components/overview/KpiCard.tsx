"use client";

import { type ReactNode } from "react";

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-[color:var(--color-success)]"
      : tone === "warning"
        ? "text-[color:var(--color-danger)]"
        : "text-[color:var(--color-fg)]";
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-fg-muted)]">
        {label}
      </span>
      <span className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</span>
      {hint ? <span className="text-xs text-[color:var(--color-fg-muted)]">{hint}</span> : null}
    </div>
  );
}

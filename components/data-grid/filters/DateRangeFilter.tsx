"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Date-range filter for `createdAt`. Native `<input type="date">` is
 * intentional: it's accessible, keyboard-friendly, locale-aware via
 * the browser, and free. A heavier picker (Hijri toggle, range mode)
 * lands in Phase 6 with the Settings calendar control.
 *
 * The schema expects ISO-8601 with offset; we promote `YYYY-MM-DD` to
 * the start/end of day in UTC (`dateTo` is exclusive per CLAUDE.md).
 */
export function DateRangeFilter({
  label,
  dateFrom,
  dateTo,
  onChange,
}: {
  label: string;
  dateFrom: string | undefined;
  dateTo: string | undefined;
  onChange: (next: { from: string | undefined; to: string | undefined }) => void;
}) {
  const t = useTranslations("transactions.filters");
  const fromId = useId();
  const toId = useId();
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(toDateInput(dateFrom));
  const [draftTo, setDraftTo] = useState(toDateInput(dateTo, /* exclusive */ true));

  const isActive = dateFrom !== undefined || dateTo !== undefined;

  function apply() {
    const from = draftFrom ? `${draftFrom}T00:00:00.000Z` : undefined;
    // `dateTo` is exclusive: a user picking "2026-04-30" expects to
    // include 2026-04-30, so promote to start of next day.
    const to = draftTo ? `${addDays(draftTo, 1)}T00:00:00.000Z` : undefined;
    onChange({ from, to });
    setOpen(false);
  }

  function clear() {
    setDraftFrom("");
    setDraftTo("");
    onChange({ from: undefined, to: undefined });
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraftFrom(toDateInput(dateFrom));
          setDraftTo(toDateInput(dateTo, true));
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("openFilterFor", { column: label })}
          aria-pressed={isActive}
          className="inline-flex items-center justify-center rounded p-1 text-[color:var(--color-fg-muted)] outline-none hover:text-[color:var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
        >
          <Filter className="size-3.5" aria-hidden />
          {isActive ? (
            <span
              className="ms-1 inline-block size-1.5 rounded-full bg-[color:var(--color-primary)]"
              aria-hidden
            />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold">{label}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor={fromId} className="text-xs text-[color:var(--color-fg-muted)]">
                {t("from")}
              </label>
              <input
                id={fromId}
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={toId} className="text-xs text-[color:var(--color-fg-muted)]">
                {t("to")}
              </label>
              <input
                id={toId}
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={clear}
              className="text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
            >
              {t("clear")}
            </button>
            <button
              type="button"
              onClick={apply}
              className="rounded-md bg-[color:var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-primary-contrast)]"
            >
              {t("apply")}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function toDateInput(iso: string | undefined, exclusive = false): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // For `dateTo` (exclusive in URL contract) the picker should display
  // the inclusive equivalent: subtract one day.
  if (exclusive) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function addDays(yyyyMmDd: string, days: number): string {
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

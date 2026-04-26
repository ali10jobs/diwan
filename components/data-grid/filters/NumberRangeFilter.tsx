"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Number-range filter for `amountSar`. Inputs operate in **whole SAR**
 * for the user's sake; conversion to halalas (×100) happens at apply
 * time so the URL contract (which is in halalas) stays integer-clean.
 */
export function NumberRangeFilter({
  label,
  minSar,
  maxSar,
  onChange,
}: {
  label: string;
  /** committed minimum in halalas */
  minSar: number | undefined;
  /** committed maximum in halalas */
  maxSar: number | undefined;
  onChange: (next: { min: number | undefined; max: number | undefined }) => void;
}) {
  const t = useTranslations("transactions.filters");
  const minId = useId();
  const maxId = useId();
  const [open, setOpen] = useState(false);
  const [draftMin, setDraftMin] = useState<string>(
    minSar !== undefined ? String(minSar / 100) : "",
  );
  const [draftMax, setDraftMax] = useState<string>(
    maxSar !== undefined ? String(maxSar / 100) : "",
  );

  const isActive = minSar !== undefined || maxSar !== undefined;

  function apply() {
    const min = draftMin === "" ? undefined : Math.max(0, Math.round(Number(draftMin) * 100));
    const max = draftMax === "" ? undefined : Math.max(0, Math.round(Number(draftMax) * 100));
    onChange({ min, max });
    setOpen(false);
  }

  function clear() {
    setDraftMin("");
    setDraftMax("");
    onChange({ min: undefined, max: undefined });
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraftMin(minSar !== undefined ? String(minSar / 100) : "");
          setDraftMax(maxSar !== undefined ? String(maxSar / 100) : "");
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
              <label htmlFor={minId} className="text-xs text-[color:var(--color-fg-muted)]">
                {t("min")}
              </label>
              <input
                id={minId}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={draftMin}
                onChange={(e) => setDraftMin(e.target.value)}
                className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={maxId} className="text-xs text-[color:var(--color-fg-muted)]">
                {t("max")}
              </label>
              <input
                id={maxId}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={draftMax}
                onChange={(e) => setDraftMax(e.target.value)}
                className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
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

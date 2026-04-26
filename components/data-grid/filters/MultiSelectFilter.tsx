"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Multi-select column filter — used for status, type, channel, governorate.
 * Renders a popover with a checkbox list. Selection is buffered locally
 * and committed via "Apply" so the user can build a multi-pick set
 * without firing a network request per click.
 */
export function MultiSelectFilter<T extends string>({
  label,
  options,
  value,
  onChange,
  optionLabel,
}: {
  label: string;
  options: readonly T[];
  value: readonly T[] | undefined;
  onChange: (next: T[] | undefined) => void;
  optionLabel: (key: T) => string;
}) {
  const t = useTranslations("transactions.filters");
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<T>>(() => new Set(value ?? []));

  const selectedCount = value?.length ?? 0;
  const isActive = selectedCount > 0;

  function toggle(key: T) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function apply() {
    const arr = Array.from(draft);
    onChange(arr.length === 0 ? undefined : arr);
    setOpen(false);
  }

  function clear() {
    setDraft(new Set());
    onChange(undefined);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Re-seed the draft from the committed value every time the popover
        // opens, so abandoning an in-progress selection (Esc / outside click)
        // is non-destructive.
        if (next) setDraft(new Set(value ?? []));
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
              className="ms-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-primary)] px-1 text-[10px] font-semibold text-[color:var(--color-primary-contrast)]"
              aria-hidden
            >
              {selectedCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div role="group" aria-labelledby={headingId} className="flex flex-col gap-3">
          <div id={headingId} className="text-sm font-semibold">
            {label}
          </div>
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {options.map((opt) => {
              const checked = draft.has(opt);
              return (
                <li key={opt}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[color:var(--color-bg)]">
                    <Checkbox checked={checked} onCheckedChange={() => toggle(opt)} />
                    <span>{optionLabel(opt)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
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

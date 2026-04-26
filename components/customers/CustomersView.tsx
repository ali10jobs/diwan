"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Customer } from "@/lib/types/customer";
import type { Locale } from "@/lib/i18n/config";
import { formatSar } from "@/lib/formatters/currency";
import { useCustomersQuery } from "./useCustomersQuery";

const ROW_HEIGHT = 64;

export function CustomersView() {
  const t = useTranslations("customers");
  const tStatus = useTranslations("customers.statusLabel");
  const tTier = useTranslations("customers.tierLabel");
  const tGov = useTranslations("transactions.governorate");
  const locale = useLocale() as Locale;
  const fmt = useFormatter();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  // 200ms debounce keeps the route handler off the keystroke critical path.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 200);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isLoading, isError, error, refetch, isFetching } = useCustomersQuery(debounced);
  const customers = useMemo(() => data?.items ?? [], [data]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => customers.find((c) => c.id === selectedId) ?? customers[0] ?? null,
    [customers, selectedId],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: customers.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1]!.end : 0;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
            {t("rowsFound", { count: data?.total ?? 0 })}
          </p>
        </div>
        <div aria-live="polite" className="text-xs text-[color:var(--color-fg-muted)]">
          {isFetching ? t("refreshing") : null}
        </div>
      </header>

      {isError ? (
        <div
          role="alert"
          className="rounded-lg border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 p-4 text-sm"
        >
          <p className="font-medium text-[color:var(--color-danger)]">
            {(error as Error)?.message ?? t("errors.unknown")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded border border-[color:var(--color-border)] px-3 py-1 text-xs"
          >
            {t("errors.retry")}
          </button>
        </div>
      ) : (
        // Master/detail layout. ≤ md: stack list, then detail (push-style
        // navigation per CLAUDE.md). ≥ lg: side-by-side split pane —
        // the inline-start side carries the list, inline-end the detail,
        // mirrored automatically by `dir`.
        <div className="grid gap-4 lg:grid-cols-[minmax(320px,400px)_1fr]">
          <section
            aria-label={t("listLabel")}
            className="flex flex-col gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-3"
          >
            <label htmlFor="customers-search" className="sr-only">
              {t("searchLabel")}
            </label>
            <input
              id="customers-search"
              type="search"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
            />
            <div
              ref={scrollRef}
              // Only adopt the listbox role once the list has at least
              // one option — axe (WCAG 1.3.1) requires `role="listbox"`
              // to contain `role="option"` children, which fails on the
              // empty/loading states.
              {...(customers.length > 0
                ? { role: "listbox", "aria-label": t("listLabel") }
                : { "aria-label": t("listLabel") })}
              className="relative max-h-[60vh] overflow-auto rounded-md border border-[color:var(--color-border)]"
            >
              {isLoading ? (
                <p className="p-4 text-center text-sm text-[color:var(--color-fg-muted)]">
                  {t("loading")}
                </p>
              ) : customers.length === 0 ? (
                <p className="p-6 text-center text-sm text-[color:var(--color-fg-muted)]">
                  {t("empty")}
                </p>
              ) : (
                <div style={{ height: totalSize }}>
                  <div style={{ paddingTop, paddingBottom }}>
                    {virtualRows.map((vRow) => {
                      const c = customers[vRow.index]!;
                      const isSelected = selected?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => setSelectedId(c.id)}
                          style={{ height: ROW_HEIGHT }}
                          className={`flex w-full flex-col items-start justify-center gap-0.5 px-3 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--color-ring)] ${
                            isSelected
                              ? "bg-[color:var(--color-primary)]/10 text-[color:var(--color-fg)]"
                              : "hover:bg-[color:var(--color-bg)]/60"
                          }`}
                        >
                          <span className="font-medium">{c.displayName[locale]}</span>
                          <span className="text-xs text-[color:var(--color-fg-muted)]">
                            {c.msisdn} · {tTier(c.tier)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section
            aria-label={t("detailLabel")}
            className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5"
          >
            {selected ? (
              <CustomerDetail
                customer={selected}
                locale={locale}
                t={t}
                tStatus={tStatus}
                tTier={tTier}
                tGov={tGov}
                fmtDate={(iso) => fmt.dateTime(new Date(iso), { dateStyle: "medium" })}
              />
            ) : (
              <p className="text-sm text-[color:var(--color-fg-muted)]">{t("emptyDetail")}</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CustomerDetail({
  customer,
  locale,
  t,
  tStatus,
  tTier,
  tGov,
  fmtDate,
}: {
  customer: Customer;
  locale: Locale;
  t: (key: string) => string;
  tStatus: (key: Customer["status"]) => string;
  tTier: (key: Customer["tier"]) => string;
  tGov: (key: string) => string;
  fmtDate: (iso: string) => string;
}) {
  return (
    <article className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-semibold">{customer.displayName[locale]}</h2>
        <p className="text-sm text-[color:var(--color-fg-muted)]">{customer.msisdn}</p>
      </header>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Field label={t("fields.status")} value={tStatus(customer.status)} />
        <Field label={t("fields.tier")} value={tTier(customer.tier)} />
        <Field label={t("fields.governorate")} value={tGov(customer.governorate)} />
        <Field label={t("fields.joined")} value={fmtDate(customer.joinedAt)} />
        <Field
          label={t("fields.lifetimeValue")}
          value={formatSar(customer.lifetimeValueSar, locale)}
        />
        <Field label={t("fields.id")} value={<span className="font-mono">{customer.id}</span>} />
      </dl>
    </article>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-[color:var(--color-fg-muted)]">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

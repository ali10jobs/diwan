"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { KpiCard } from "./KpiCard";
import { RevenueTimeSeries } from "./RevenueTimeSeries";
import { GovernorateBreakdown } from "./GovernorateBreakdown";
import { useOverviewQuery } from "./useOverviewQuery";
import type { Locale } from "@/lib/i18n/config";
import { formatSar } from "@/lib/formatters/currency";

export function OverviewView() {
  const t = useTranslations("overview");
  const locale = useLocale() as Locale;
  const fmt = useFormatter();
  const { data, isLoading, isError, error, refetch } = useOverviewQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]"
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
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
    );
  }

  const { kpis } = data;
  const failureRatePct = kpis.failureRate * 100;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      <section aria-label={t("kpisLabel")} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("kpis.revenue")} value={formatSar(kpis.revenueSar, locale)} />
        <KpiCard label={t("kpis.activeCustomers")} value={fmt.number(kpis.activeCustomers)} />
        <KpiCard label={t("kpis.arpu")} value={formatSar(kpis.arpuSar, locale)} />
        <KpiCard
          label={t("kpis.failureRate")}
          value={`${fmt.number(failureRatePct, { maximumFractionDigits: 2 })}%`}
          tone={failureRatePct > 12 ? "warning" : "neutral"}
        />
      </section>

      <section
        aria-labelledby="overview-revenue-heading"
        className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4"
      >
        <h2 id="overview-revenue-heading" className="text-sm font-semibold">
          {t("charts.revenueTimeSeries")}
        </h2>
        <p className="mt-0.5 text-xs text-[color:var(--color-fg-muted)]">
          {t("charts.revenueHint")}
        </p>
        <div className="mt-3">
          <RevenueTimeSeries data={data.timeSeries} />
        </div>
      </section>

      <section
        aria-labelledby="overview-gov-heading"
        className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4"
      >
        <h2 id="overview-gov-heading" className="text-sm font-semibold">
          {t("charts.governorateBreakdown")}
        </h2>
        <p className="mt-0.5 text-xs text-[color:var(--color-fg-muted)]">
          {t("charts.governorateHint")}
        </p>
        <div className="mt-3">
          <GovernorateBreakdown data={data.governorateBreakdown} />
        </div>
      </section>
    </div>
  );
}

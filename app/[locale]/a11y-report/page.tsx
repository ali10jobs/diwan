import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { readA11yReport } from "@/lib/a11y/report";

export const dynamic = "force-dynamic";

export default async function A11yReportPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("a11yReport");

  const report = await readA11yReport();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      {!report ? (
        <div
          role="status"
          className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5 text-sm text-[color:var(--color-fg-muted)]"
        >
          {t("missing")}
        </div>
      ) : (
        <>
          <section
            aria-labelledby="a11y-summary-heading"
            className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5"
          >
            <h2 id="a11y-summary-heading" className="text-base font-semibold">
              {t("summary")}
            </h2>
            <p className="mt-1 text-xs text-[color:var(--color-fg-muted)]">
              {t("generatedAt", { iso: report.generatedAt })}
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-4">
              <Stat
                label={t("stats.blocking")}
                value={report.summary.blocking}
                tone={report.summary.blocking === 0 ? "positive" : "danger"}
              />
              <Stat label={t("stats.moderate")} value={report.summary.moderate} />
              <Stat label={t("stats.minor")} value={report.summary.minor} />
              <Stat label={t("stats.cleanScreens")} value={report.summary.cleanScreens} />
            </dl>
          </section>

          <section
            aria-labelledby="a11y-screens-heading"
            className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5"
          >
            <h2 id="a11y-screens-heading" className="text-base font-semibold">
              {t("screens")}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {report.screens.map((s, i) => (
                <ScreenRow key={i} result={s} t={t} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "positive" | "danger";
}) {
  const toneClass =
    tone === "positive"
      ? "text-[color:var(--color-success)]"
      : tone === "danger"
        ? "text-[color:var(--color-danger)]"
        : "text-[color:var(--color-fg)]";
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wide text-[color:var(--color-fg-muted)]">
        {label}
      </dt>
      <dd className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</dd>
    </div>
  );
}

function ScreenRow({
  result,
  t,
}: {
  result: import("@/lib/a11y/report").A11yScreenResult;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const isClean = result.violations.length === 0;
  return (
    <li className="rounded-md border border-[color:var(--color-border)] p-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {result.screen} · {result.locale} / {result.brand} / {result.theme}
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isClean
              ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
              : "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]"
          }`}
        >
          {isClean
            ? t("status.clean")
            : t("status.violations", { count: result.violations.length })}
        </span>
      </header>
      {!isClean ? (
        <ul className="mt-2 flex flex-col gap-1.5 text-xs">
          {result.violations.map((v) => (
            <li key={v.id} className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[11px] text-[color:var(--color-fg-muted)]">
                {v.id}
              </span>
              <span>{v.help}</span>
              {v.impact ? (
                <span className="rounded bg-[color:var(--color-bg)] px-1.5 py-0.5 font-medium uppercase tracking-wide">
                  {v.impact}
                </span>
              ) : null}
              <span className="text-[color:var(--color-fg-muted)]">
                {t("nodes", { count: v.nodes })}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

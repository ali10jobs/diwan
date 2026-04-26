import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { LocaleSwitcher } from "@/components/locale/LocaleSwitcher";
import { NumeralSwitcher } from "@/components/locale/NumeralSwitcher";
import { CalendarSwitcher } from "@/components/locale/CalendarSwitcher";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { BrandSwitcher } from "@/components/theme/BrandSwitcher";
import { DensitySwitcher } from "@/components/theme/DensitySwitcher";
import { readCalendarCookie, readNumeralsCookie } from "@/lib/i18n/preferences-ssr";
import { formatDate } from "@/lib/formatters/date";

export default async function SettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [numerals, calendar, t, tTheme, tBrand, tDensity, tNumerals, tCalendar] = await Promise.all(
    [
      readNumeralsCookie(),
      readCalendarCookie(),
      getTranslations("settings"),
      getTranslations("theme"),
      getTranslations("brand"),
      getTranslations("density"),
      getTranslations("settings.numerals"),
      getTranslations("settings.calendar"),
    ],
  );

  // Live preview ensures the user can see — at first paint — the format
  // their cookie is producing. Hijri/Gregorian and digit shaping both
  // visible at a glance.
  const previewDate = formatDate(new Date(), locale, {
    calendar,
    numerals,
    dateStyle: "full",
  });

  return (
    <div className="flex max-w-4xl flex-col gap-8 p-4 sm:p-6 lg:p-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      <Section
        title={t("sections.locale")}
        description={t("sections.localeHint")}
        preview={previewDate}
      >
        <LocaleSwitcher />
        <NumeralSwitcher
          label={tNumerals("label")}
          current={numerals}
          labels={{
            auto: tNumerals("auto"),
            arab: tNumerals("arab"),
            latn: tNumerals("latn"),
          }}
        />
        <CalendarSwitcher
          label={tCalendar("label")}
          current={calendar}
          labels={{
            gregory: tCalendar("gregory"),
            "islamic-umalqura": tCalendar("islamic-umalqura"),
          }}
        />
      </Section>

      <Section title={t("sections.appearance")} description={t("sections.appearanceHint")}>
        <ThemeSwitcher
          label={tTheme("label")}
          labels={{
            light: tTheme("light"),
            dark: tTheme("dark"),
            system: tTheme("system"),
          }}
        />
        <BrandSwitcher label={tBrand("label")} />
        <DensitySwitcher
          label={tDensity("label")}
          labels={{
            comfortable: tDensity("comfortable"),
            compact: tDensity("compact"),
          }}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  preview,
  children,
}: {
  title: string;
  description: string;
  preview?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,260px)_1fr]">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-[color:var(--color-fg-muted)]">{description}</p>
          {preview ? (
            <p className="mt-3 text-xs">
              <span className="block text-[color:var(--color-fg-muted)]">Preview</span>
              <span className="mt-0.5 inline-block rounded bg-[color:var(--color-bg)] px-2 py-1 font-medium tabular-nums">
                {preview}
              </span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-start gap-4">{children}</div>
      </div>
    </section>
  );
}

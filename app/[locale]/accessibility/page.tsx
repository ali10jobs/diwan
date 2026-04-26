import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

export default async function AccessibilityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accessibility");

  return (
    <div className="flex max-w-3xl flex-col gap-6 p-4 sm:p-6 lg:p-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      <section className="prose prose-sm max-w-none text-[color:var(--color-fg)]">
        <h2 className="mt-0 text-lg font-semibold">{t("standard.title")}</h2>
        <p>{t("standard.body")}</p>

        <h2 className="text-lg font-semibold">{t("scope.title")}</h2>
        <ul className="ms-5 list-disc space-y-1">
          <li>{t("scope.bullets.locales")}</li>
          <li>{t("scope.bullets.themes")}</li>
          <li>{t("scope.bullets.brands")}</li>
          <li>{t("scope.bullets.viewports")}</li>
        </ul>

        <h2 className="text-lg font-semibold">{t("automated.title")}</h2>
        <p>{t("automated.body")}</p>

        <h2 className="text-lg font-semibold">{t("manual.title")}</h2>
        <ul className="ms-5 list-disc space-y-1">
          <li>{t("manual.orca")}</li>
          <li>{t("manual.voiceover")}</li>
          <li>{t("manual.nvda")}</li>
        </ul>

        <h2 className="text-lg font-semibold">{t("knownGaps.title")}</h2>
        <p>{t("knownGaps.body")}</p>

        <h2 className="text-lg font-semibold">{t("contact.title")}</h2>
        <p>{t("contact.body")}</p>
      </section>
    </div>
  );
}

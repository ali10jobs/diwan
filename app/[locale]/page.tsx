import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale/LocaleSwitcher";
import type { Locale } from "@/lib/i18n/config";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("phase0");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{t("heading")}</h1>
      <p className="text-sm text-zinc-600">{t("subtitle")}</p>
      <LocaleSwitcher />
    </main>
  );
}

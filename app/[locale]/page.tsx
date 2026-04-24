import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("phase0");

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("heading")}</h1>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">{t("subtitle")}</p>
      </div>
      <section className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        <Swatch name="primary" />
        <Swatch name="accent" />
        <Swatch name="bg-elevated" border />
        <Swatch name="fg" />
        <Swatch name="success" />
        <Swatch name="danger" />
      </section>
    </div>
  );
}

function Swatch({ name, border = false }: { name: string; border?: boolean }) {
  return (
    <div
      className={`flex h-20 items-end justify-start rounded-md p-3 text-xs font-medium ${
        border ? "border border-[color:var(--color-border)]" : ""
      }`}
      style={{ backgroundColor: `var(--color-${name})`, color: "var(--color-primary-contrast)" }}
    >
      <span className="rounded bg-black/75 px-2 py-0.5 text-white">{name}</span>
    </div>
  );
}

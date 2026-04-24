import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale/LocaleSwitcher";
import { BrandSwitcher } from "@/components/theme/BrandSwitcher";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import type { Locale } from "@/lib/i18n/config";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("phase0");
  const tTheme = await getTranslations("theme");
  const tBrand = await getTranslations("brand");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{t("heading")}</h1>
      <p className="text-sm text-[color:var(--color-fg-muted)]">{t("subtitle")}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <LocaleSwitcher />
        <BrandSwitcher label={tBrand("label")} />
        <ThemeSwitcher
          label={tTheme("label")}
          labels={{
            light: tTheme("light"),
            dark: tTheme("dark"),
            system: tTheme("system"),
          }}
        />
      </div>
      <section className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        <Swatch name="primary" />
        <Swatch name="accent" />
        <Swatch name="bg-elevated" border />
        <Swatch name="fg" />
        <Swatch name="success" />
        <Swatch name="danger" />
      </section>
    </main>
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
      <span className="rounded bg-black/30 px-2 py-0.5 text-white">{name}</span>
    </div>
  );
}

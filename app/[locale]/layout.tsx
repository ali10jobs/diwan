import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { defaultLocale, localeDirection, locales, type Locale } from "@/lib/i18n/config";
import { routing } from "@/lib/i18n/navigation";
import { BrandProvider } from "@/components/theme/BrandProvider";
import { DensityProvider } from "@/components/theme/DensityProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { QueryProvider } from "@/components/query/QueryProvider";
import {
  readBrandCookie,
  readDensityCookie,
  readThemeCookie,
  resolveInitialThemeAttr,
} from "@/lib/theme/ssr";
import "../globals.css";

const inter = Inter({
  variable: "--font-sans-en",
  subsets: ["latin"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-sans-ar",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = hasLocale(routing.locales, locale) ? locale : defaultLocale;
  const t = await getTranslations({ locale: safeLocale, namespace: "app" });
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const [messages, brand, themeMode, density] = await Promise.all([
    getMessages(),
    readBrandCookie(),
    readThemeCookie(),
    readDensityCookie(),
  ]);
  const dir = localeDirection[locale];
  const initialThemeAttr = resolveInitialThemeAttr(themeMode);

  return (
    <html
      lang={locale}
      dir={dir}
      data-brand={brand}
      data-density={density}
      {...(initialThemeAttr ? { "data-theme": initialThemeAttr } : {})}
      className={`${inter.variable} ${plexArabic.variable} h-full antialiased`}
      // next-themes rewrites `data-theme` and `style="color-scheme"` after
      // hydration when the user's preference is `system`; suppress the
      // hydration warning for exactly those attributes on <html>. FOUC is
      // prevented at the CSS layer via `@media (prefers-color-scheme)`
      // fallbacks in the generated tokens.css, so no pre-hydration script
      // is needed.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <BrandProvider initialBrand={brand}>
            <ThemeProvider defaultMode={themeMode}>
              <DensityProvider initialDensity={density}>
                <QueryProvider>
                  <AppShell>{children}</AppShell>
                </QueryProvider>
              </DensityProvider>
            </ThemeProvider>
          </BrandProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

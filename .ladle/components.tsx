import type { GlobalProvider } from "@ladle/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../messages/en.json";
import arMessages from "../messages/ar.json";
import "../app/globals.css";

// Global Ladle toolbar args — these show up as pickers at the top of the
// Ladle UI and drive the 6-cell matrix (2 locales × 2 brands × 2 themes).
// The keys match what each story opts into via `.args` so individual
// stories can also override them.
export const argTypes = {
  locale: {
    control: { type: "select" },
    options: ["en", "ar"],
    defaultValue: "en",
  },
  brand: {
    control: { type: "select" },
    options: ["bayan", "alt"],
    defaultValue: "bayan",
  },
  theme: {
    control: { type: "select" },
    options: ["light", "dark"],
    defaultValue: "light",
  },
};

export const Provider: GlobalProvider = ({ children, globalState }) => {
  // Ladle's `globalState.control` carries the picked values for addon
  // controls. We accept either flat args or nested under `control`.
  const args = (globalState as unknown as { control?: Record<string, unknown> }).control ?? {};
  const locale = (args.locale as "en" | "ar") ?? "en";
  const brand = (args.brand as "bayan" | "alt") ?? "bayan";
  const theme = (args.theme as "light" | "dark") ?? "light";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const messages = locale === "ar" ? arMessages : enMessages;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div
        lang={locale}
        dir={dir}
        data-brand={brand}
        data-theme={theme}
        className="min-h-screen bg-background p-8 text-foreground"
      >
        {children}
      </div>
    </NextIntlClientProvider>
  );
};

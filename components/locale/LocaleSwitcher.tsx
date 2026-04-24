"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter, usePathname } from "@/lib/i18n/navigation";
import { locales, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onChange = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div className="inline-flex items-center gap-2" aria-busy={isPending}>
      <label htmlFor="locale-switch" className="text-sm text-[color:var(--color-fg-muted)]">
        {t("switchLabel")}
      </label>
      <select
        id="locale-switch"
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
        disabled={isPending}
        className="h-11 min-w-[9rem] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 text-sm text-[color:var(--color-fg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:opacity-60"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {t(l)}
          </option>
        ))}
      </select>
    </div>
  );
}

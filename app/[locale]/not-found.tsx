import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("errors");
  return (
    <main
      id="main"
      className="flex min-h-[60vh] flex-col items-start justify-center gap-4 p-6 sm:p-10"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">{t("notFoundBody")}</p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-md bg-[color:var(--color-primary)] px-4 text-sm font-medium text-[color:var(--color-primary-contrast)]"
      >
        {t("goHome")}
      </Link>
    </main>
  );
}

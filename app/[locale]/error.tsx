"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

// Localized error boundary per CLAUDE.md → "Error & Loading UX
// Contract". The errorId surfaces in the body and the matching
// `x-error-id` response header so the demo viewer can correlate
// without a third-party SDK.

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // No external observability per CLAUDE.md scope cuts; we rely on
    // platform logs + the digest for in-flight correlation.
    if (process.env.NODE_ENV !== "production") {
      console.error("LocaleError", error);
    }
  }, [error]);

  const errorId = error.digest ?? "unknown";

  return (
    <main
      id="main"
      role="alert"
      className="flex min-h-[60vh] flex-col items-start justify-center gap-4 p-6 sm:p-10"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">{t("body")}</p>
        <p className="mt-3 text-xs font-mono text-[color:var(--color-fg-muted)]">
          {t("errorId", { id: errorId })}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-md bg-[color:var(--color-primary)] px-4 text-sm font-medium text-[color:var(--color-primary-contrast)]"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 text-sm font-medium"
        >
          {t("goHome")}
        </Link>
      </div>
    </main>
  );
}

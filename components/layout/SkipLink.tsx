import { getTranslations } from "next-intl/server";

/**
 * Hidden until focused — presses Tab once on any page and screen-reader
 * or keyboard users can jump over the nav straight to `#main`. Must be
 * the first focusable element in the tab order.
 */
export async function SkipLink() {
  const t = await getTranslations("a11y");
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[60] focus:rounded-md focus:bg-[color:var(--color-primary)] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-[color:var(--color-primary-contrast)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]"
    >
      {t("skipToContent")}
    </a>
  );
}

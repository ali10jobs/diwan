"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { navItems } from "@/lib/nav/items";
import { cn } from "@/lib/utils";

/**
 * Nav list shared between the desktop sidebar and the mobile drawer.
 * The active route is detected against the pathname stripped of the
 * locale prefix so `/en/transactions` and `/ar/transactions` both mark
 * the same item `aria-current="page"`.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  // Strip the leading `/{locale}` segment so comparisons work for the
  // root "/" nav item as well as nested ones.
  const unprefixed = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";

  return (
    <nav aria-label={t("primary")} className="flex flex-col gap-1">
      {navItems.map(({ key, href, icon: Icon }) => {
        const isActive = href === "/" ? unprefixed === "/" : unprefixed.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              "text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-bg-elevated)] hover:text-[color:var(--color-fg)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]",
              isActive && "bg-[color:var(--color-bg-elevated)] text-[color:var(--color-fg)]",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

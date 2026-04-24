"use client";

import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./SidebarNav";

/**
 * Mobile drawer. Opens from the inline-start edge (flips to the right
 * in RTL via the Sheet's `side="start"` variant). Radix Dialog — which
 * powers our RTL-patched Sheet — provides the focus trap, escape
 * dismissal, and `aria-modal` semantics CLAUDE.md asks for on the
 * mobile drawer.
 */
export function MobileNav() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("a11y.openNav")} className="lg:hidden">
          <MenuIcon className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="start" className="w-72 gap-0 p-0">
        <SheetHeader className="border-b border-[color:var(--color-border)] px-4 py-3">
          <SheetTitle className="text-start">{t("app.name")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { getTranslations } from "next-intl/server";
import { SidebarNav } from "./SidebarNav";

/**
 * Desktop sidebar. Hidden <lg; pinned to the inline-start edge ≥lg, so
 * it flips side naturally in RTL via `border-e` (border on inline-end
 * edge, facing the main content).
 */
export async function Sidebar() {
  const t = await getTranslations("app");
  return (
    <aside
      aria-label={t("sidebarLabel")}
      className="hidden lg:flex lg:w-60 lg:flex-col lg:border-e lg:border-[color:var(--color-border)] lg:bg-[color:var(--color-bg)]"
    >
      <div className="flex h-14 items-center border-b border-[color:var(--color-border)] px-4">
        <span className="text-base font-semibold">{t("name")}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav />
      </div>
    </aside>
  );
}

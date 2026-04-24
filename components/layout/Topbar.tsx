import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale/LocaleSwitcher";
import { BrandSwitcher } from "@/components/theme/BrandSwitcher";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { DensitySwitcher } from "@/components/theme/DensitySwitcher";
import { MobileNav } from "./MobileNav";

/**
 * Topbar. Mobile: hamburger + app name; switchers collapse behind a
 * menu in the drawer or settings screen (Phase 6). Desktop: shows all
 * four switchers inline (locale, brand, theme, density).
 */
export async function Topbar() {
  const tTheme = await getTranslations("theme");
  const tBrand = await getTranslations("brand");
  const tDensity = await getTranslations("density");
  const tApp = await getTranslations("app");

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/90 px-4 backdrop-blur"
    >
      <MobileNav />
      <span className="text-sm font-semibold lg:hidden">{tApp("name")}</span>
      <div className="ms-auto flex flex-wrap items-center gap-3">
        <LocaleSwitcher />
        <div className="hidden xl:block">
          <BrandSwitcher label={tBrand("label")} />
        </div>
        <div className="hidden xl:block">
          <DensitySwitcher
            label={tDensity("label")}
            labels={{
              comfortable: tDensity("comfortable"),
              compact: tDensity("compact"),
            }}
          />
        </div>
        <ThemeSwitcher
          label={tTheme("label")}
          labels={{
            light: tTheme("light"),
            dark: tTheme("dark"),
            system: tTheme("system"),
          }}
        />
      </div>
    </header>
  );
}

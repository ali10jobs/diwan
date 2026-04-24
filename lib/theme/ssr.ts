import { cookies } from "next/headers";
import {
  BRAND_COOKIE,
  type Brand,
  defaultBrand,
  defaultTheme,
  isBrand,
  isTheme,
  THEME_COOKIE,
  type ThemeMode,
} from "./config";

export async function readBrandCookie(): Promise<Brand> {
  const jar = await cookies();
  const value = jar.get(BRAND_COOKIE)?.value;
  return isBrand(value) ? value : defaultBrand;
}

export async function readThemeCookie(): Promise<ThemeMode> {
  const jar = await cookies();
  const value = jar.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : defaultTheme;
}

/** Resolve to a concrete `light|dark` for the SSR `data-theme` attribute.
 * When the preference is `system` (or missing) we leave it undefined and
 * rely on a pre-hydration script to read `prefers-color-scheme`. */
export function resolveInitialThemeAttr(mode: ThemeMode): "light" | "dark" | undefined {
  return mode === "system" ? undefined : mode;
}

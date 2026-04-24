export const brands = ["bayan", "alt"] as const;
export type Brand = (typeof brands)[number];

export const defaultBrand: Brand = "bayan";

export const brandLabels: Record<Brand, string> = {
  bayan: "Bayan",
  alt: "Alt",
};

export const BRAND_COOKIE = "diwan.brand";

export function isBrand(value: string | undefined | null): value is Brand {
  return !!value && (brands as readonly string[]).includes(value);
}

// next-themes modes — mirror here so the server and client agree.
export const themes = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof themes)[number];
export const defaultTheme: ThemeMode = "system";
export const THEME_COOKIE = "diwan.theme";

export function isTheme(value: string | undefined | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

// Density — comfortable is the default; compact tightens paddings on
// data-dense screens (Transactions, Customers). The attribute rides on
// `<html data-density>` so CSS can key off it without prop drilling.
export const densities = ["comfortable", "compact"] as const;
export type Density = (typeof densities)[number];
export const defaultDensity: Density = "comfortable";
export const DENSITY_COOKIE = "diwan.density";

export const densityLabels: Record<Density, string> = {
  comfortable: "Comfortable",
  compact: "Compact",
};

export function isDensity(value: string | undefined | null): value is Density {
  return value === "comfortable" || value === "compact";
}

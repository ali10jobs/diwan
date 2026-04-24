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

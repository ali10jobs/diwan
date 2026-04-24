"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { THEME_COOKIE, type ThemeMode } from "@/lib/theme/config";

type Ctx = { theme: ThemeMode; setTheme: (next: ThemeMode) => void };

const ThemeContext = createContext<Ctx | null>(null);
const ONE_YEAR = 60 * 60 * 24 * 365;

function writeCookie(value: ThemeMode) {
  document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

function resolve(mode: ThemeMode): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Minimal theme provider — enough for runtime `data-theme` swap on <html>,
 * "system" preference tracking via `matchMedia`, and cookie persistence so
 * SSR paints the correct theme on first byte. FOUC is prevented at the CSS
 * layer (`@media (prefers-color-scheme: dark)` in tokens.css), so no
 * pre-hydration script is needed.
 */
export function ThemeProvider({
  children,
  defaultMode,
}: {
  children: React.ReactNode;
  defaultMode: ThemeMode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultMode);

  useEffect(() => {
    document.documentElement.dataset.theme = resolve(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    writeCookie(next);
  }, []);

  const value = useMemo<Ctx>(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

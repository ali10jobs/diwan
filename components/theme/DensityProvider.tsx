"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DENSITY_COOKIE, type Density, isDensity } from "@/lib/theme/config";

type Ctx = { density: Density; setDensity: (next: Density) => void };
const DensityContext = createContext<Ctx | null>(null);
const ONE_YEAR = 60 * 60 * 24 * 365;

export function DensityProvider({
  children,
  initialDensity,
}: {
  children: React.ReactNode;
  initialDensity: Density;
}) {
  const [density, setDensityState] = useState<Density>(initialDensity);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  const setDensity = useCallback((next: Density) => {
    if (!isDensity(next)) return;
    setDensityState(next);
    document.cookie = `${DENSITY_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
  }, []);

  const value = useMemo<Ctx>(() => ({ density, setDensity }), [density, setDensity]);

  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

export function useDensity(): Ctx {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error("useDensity must be used inside <DensityProvider>");
  return ctx;
}

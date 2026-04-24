"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { BRAND_COOKIE, type Brand, defaultBrand, isBrand } from "@/lib/theme/config";

type Ctx = { brand: Brand; setBrand: (next: Brand) => void };
const BrandContext = createContext<Ctx | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

export function BrandProvider({
  children,
  initialBrand,
}: {
  children: React.ReactNode;
  initialBrand: Brand;
}) {
  const [brand, setBrandState] = useState<Brand>(initialBrand);

  // Keep the root attribute in sync after hydration. The initial attribute
  // ships from the server layout so there is no FOUC on first paint.
  useEffect(() => {
    document.documentElement.dataset.brand = brand;
  }, [brand]);

  const setBrand = useCallback((next: Brand) => {
    if (!isBrand(next)) return;
    setBrandState(next);
    document.cookie = `${BRAND_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
  }, []);

  return <BrandContext.Provider value={{ brand, setBrand }}>{children}</BrandContext.Provider>;
}

export function useBrand(): Ctx {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside <BrandProvider>");
  return ctx;
}

export { defaultBrand };

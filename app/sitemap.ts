import type { MetadataRoute } from "next";

// Sitemap with both locale variants of every public route per
// CLAUDE.md → "SEO & Metadata". Canonicalizes against the
// production origin regardless of where the build runs.

const ORIGIN = "https://diwan-rtl-dashboard.vercel.app";
const LOCALES = ["en", "ar"] as const;
const ROUTES = [
  "",
  "/transactions",
  "/customers",
  "/agent",
  "/settings",
  "/accessibility",
  "/a11y-report",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap((route) =>
    LOCALES.map((locale) => ({
      url: `${ORIGIN}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l === "ar" ? "ar-SA" : l, `${ORIGIN}/${l}${route}`]),
        ),
      },
    })),
  );
}

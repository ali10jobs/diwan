import type { MetadataRoute } from "next";

// Environment-aware robots per CLAUDE.md → "SEO & Metadata".
// Production indexes; preview/dev disallow everything so the
// non-production URLs don't pollute search results.

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production";
  return {
    rules: [isProduction ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" }],
    host: "https://diwan-rtl-dashboard.vercel.app",
    sitemap: "https://diwan-rtl-dashboard.vercel.app/sitemap.xml",
  };
}

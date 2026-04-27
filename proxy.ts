import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/navigation";

// Locale negotiation only. Strict CSP with per-request nonce is in
// flight — naive nonce wiring blocks Next.js's hydration scripts; the
// proper integration (Next 16 + 'strict-dynamic') needs more care
// than a one-line addition. Tracked as a Phase 11 follow-up. Static
// security headers (HSTS, X-Content-Type-Options, etc.) ship from
// next.config.ts.

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match everything except Next.js internals, API routes, and static files.
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

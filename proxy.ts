import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/navigation";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match everything except Next.js internals, API routes, and static files.
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

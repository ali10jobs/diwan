# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Diwan** is a bilingual (Arabic/English), RTL-first enterprise dashboard built as a job-application artifact targeting EPAM Systems' Senior Frontend Developer role in Al Khobar, Saudi Arabia. EPAM is a services/consulting firm whose KSA offices deliver enterprise portals to Forbes-2000 clients (banks, telecom, Aramco ecosystem). Diwan is engineered to demonstrate, in a single deployable artifact, solutions to EPAM's five hardest underserved frontend problems: (1) RTL + bilingual parity, (2) accessibility on regulated enterprise UIs, (3) performance on data-heavy admin screens, (4) repeated design-system reinvention per client, and (5) AI-native UX patterns grounded in real tool-use rather than bolt-on chatbots.

The deliverable is a live Vercel URL + ~90s Loom walkthrough + this GitHub repo. Quality bar: Lighthouse ≥95 on Performance / Accessibility / Best Practices / SEO across all screens and both locales; zero critical or serious axe violations; full AR↔EN parity including RTL-correct iconography, Hijri/Gregorian calendar support, and Arabic number shaping.

---

## Product Surface

A single-tenant dashboard for **"Bayan Telecom"** (fictional KSA carrier). Five screens + one behind-the-scenes:

1. **Overview** — KPI cards, time-series chart (ARPU, churn, NPS), stacked-bar of revenue by governorate. Arabic-Indic ↔ Western numerals toggle.
2. **Transactions** — 50,000-row virtualized table, server-driven pagination, column filters, keyboard navigation, CSV export, SAR-localized currency.
3. **Customers** — master/detail view with virtualized list + RTL-correct split pane.
4. **Agent Console** — natural-language command bar in AR or EN. LLM returns a tool call; app applies it as filter state on Transactions and streams a narrative summary.
5. **Settings** — locale (AR/EN), calendar (Hijri/Gregorian), density, brand skin (Bayan / alt — proves multi-tenant tokens).
6. **/a11y-report** — renders the latest CI-produced axe + Lighthouse results as proof.

---

## Stack

| Layer               | Choice                                                                                                                                                       | Reason                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Framework           | Next.js 16 (App Router)                                                                                                                                      | RSC, streaming, i18n routing, Vercel-native |
| Language            | TypeScript strict                                                                                                                                            | Senior-signal non-negotiable                |
| Styling             | Tailwind CSS v4, logical properties only (`ps-*`, `pe-*`, `ms-*`, `me-*`)                                                                                    | RTL correctness baked in                    |
| Components          | shadcn/ui, RTL-patched in-repo                                                                                                                               | Ownable, no runtime lock-in                 |
| Headless primitives | react-aria-components (where shadcn falls short)                                                                                                             | A11y-first                                  |
| Data grid           | TanStack Table v8 + TanStack Virtual                                                                                                                         | 50k rows, keyboard-friendly                 |
| Data fetching       | TanStack Query v5                                                                                                                                            | Cache as source of truth                    |
| Forms               | React Hook Form + Zod                                                                                                                                        | Schema-validated                            |
| Charts              | Recharts — committed. Wrap every chart in an `<RtlChart>` that flips `reversed` axes and mirrors tooltip `position` when `dir==="rtl"`. No runtime fallback. | Committed to avoid Phase 6 indecision       |
| i18n                | next-intl                                                                                                                                                    | App Router-native, ICU MessageFormat        |
| Dates               | `Intl.DateTimeFormat` with `islamic-umalqura` + date-fns                                                                                                     | Hijri/Gregorian toggle                      |
| Tokens              | Style Dictionary → Tailwind preset + CSS vars                                                                                                                | One source, multi-brand                     |
| AI                  | Vercel AI SDK v6 via Vercel AI Gateway                                                                                                                       | Streaming, tool calls                       |
| Theming             | `next-themes` with `attribute="data-theme"`, `enableSystem`                                                                                                  | SSR-safe light/dark/system with no FOUC     |
| Testing             | Jest + React Testing Library (unit/component), Playwright + `@axe-core/playwright` (E2E + a11y)                                                              | Matches EPAM JD + client-account standard   |
| Observability       | `@vercel/analytics`, `web-vitals`, minimal error boundary                                                                                                    | Lightweight                                 |
| Deploy              | Vercel (Fluid Compute)                                                                                                                                       | Platform match                              |

**Pinned runtimes.** Node.js 24 LTS, pnpm 10, Next.js 16.x. `.nvmrc` + `"packageManager"` field in `package.json` + `"engines"` gate. Do not bump minor versions casually — CI is pinned against exact versions.

---

## Directory Layout

```
/
├─ app/
│  ├─ [locale]/
│  │  ├─ layout.tsx            # sets dir, lang, fonts
│  │  ├─ page.tsx              # Overview
│  │  ├─ transactions/page.tsx
│  │  ├─ customers/page.tsx
│  │  ├─ agent/page.tsx
│  │  ├─ settings/page.tsx
│  │  └─ a11y-report/page.tsx
│  ├─ api/
│  │  ├─ transactions/route.ts # server-paginated + filtered
│  │  ├─ customers/route.ts
│  │  └─ agent/route.ts        # streaming AI SDK endpoint
│  └─ globals.css
├─ components/
│  ├─ ui/                       # shadcn primitives, RTL-patched
│  ├─ data-grid/                # virtualized grid composition
│  ├─ charts/
│  ├─ layout/                   # AppShell, Sidebar (dir-aware), Topbar
│  └─ locale/                   # LocaleSwitcher, CalendarSwitcher, NumeralSwitcher
├─ lib/
│  ├─ i18n/                     # next-intl config, dictionaries
│  ├─ formatters/               # number, currency (SAR), date (Hijri/Gregorian)
│  ├─ fixtures/                 # seeded 50k transaction generator
│  ├─ ai/                       # tools schema, filter-translation tool
│  └─ a11y/                     # shared ARIA helpers
├─ tokens/
│  ├─ source/                   # brand JSON (bayan.json, alt.json)
│  └─ build/                    # Style Dictionary output
├─ messages/
│  ├─ ar.json
│  └─ en.json
├─ tests/
│  ├─ e2e/
│  │  ├─ rtl.spec.ts
│  │  ├─ a11y.spec.ts
│  │  └─ grid-perf.spec.ts
│  └─ unit/
├─ scripts/
│  ├─ build-tokens.ts
│  └─ seed-fixtures.ts
├─ CLAUDE.md
├─ README.md
├─ vercel.ts
├─ next.config.ts
├─ tailwind.config.ts
├─ package.json
└─ tsconfig.json
```

---

## Architectural Decisions (non-obvious)

- **Server-driven everything.** Transactions and Customers paginate/filter on the server via Route Handlers. No 50k payload ships to the client. The AI agent returns a _filter spec_, not results — the client re-queries.
- **Locale is a route segment** (`/ar/...`, `/en/...`). Middleware negotiates via `Accept-Language` + cookie. `dir` is set on `<html>` in `[locale]/layout.tsx`.
- **Logical properties only.** An ESLint rule blocks `pl-*`, `pr-*`, `ml-*`, `mr-*`, `left-*`, `right-*`. Enforced in CI. Any use of physical-direction utilities is a merge blocker.
- **Tokens → Tailwind preset.** `pnpm tokens:build` regenerates the preset from `tokens/source/*.json`. Brand switch at runtime = CSS variable swap at `:root[data-brand="..."]`, not a rebuild.
- **AI is a tool-user, not a text-generator.** The agent endpoint exposes a single Zod-typed tool `applyTransactionFilter({status, minAmount, dateRange, ...})`. The model fills the schema; the UI executes.
- **No Redux.** TanStack Query owns server state. React state or Zustand is reserved for genuinely local UI state (sidebar open, density).
- **Mock the backend, not the pattern.** Route handlers read from an in-memory seeded dataset (deterministic, module-cached) that behaves like a real paginated REST API with simulated 80–200ms latency. **Seed: `DIWAN_SEED=20260423` (fixed).** Fixtures are generated once at module load; Fluid Compute reuses the instance across concurrent requests, so the 50k rows are materialized once per warm function, not per request. Cold starts regenerate deterministically — never snapshot to disk.
- **shadcn/ui + Radix is a deliberate choice over MUI / Ant Design / PrimeNG** (the libraries the EPAM JD names as examples). Rationale: ownable primitives in `components/ui/` make RTL patches, ARIA contracts, and token wiring _inspectable in this repo_ rather than buried in vendor theming; Radix a11y is best-in-class (supports the zero-critical/serious axe gate); Tailwind v4 + logical properties compose natively with shadcn but fight MUI's Emotion and Ant's CSS-in-JS; MUI/Ant baseline bundles make the 180 KB/route budget uncomfortably tight; MUI RTL has known real-world bugs (Popover/Menu alignment, DataGrid resize handles) that would require forking anyway. The same discipline translates directly to MUI theming, Ant `ConfigProvider`, or PrimeNG tokens on a client engagement — only the vendor surface changes. **Phase 10 README must carry a paragraph stating this explicitly** so interviewers understand the choice is informed, not defaulted.
- **Numerals are decoupled from locale.** Arabic locale defaults to Arabic-Indic digits (`٠١٢٣`), English defaults to Western, but the Settings toggle overrides either. Persisted in cookie `diwan.numerals` with values `auto | arab | latn`. Formatters read this cookie via a server action, so SSR output is correct on first paint.

---

## Scope Cuts (deliberately NOT building)

Future sessions must not add these without a written change to this list:

- Authentication / user accounts — the app opens as a pre-authenticated "demo user."
- Real database — in-memory seeded fixtures only.
- Multi-region infra, DR, backups.
- Real-time subscriptions / websockets.
- Feature flags, A/B experiments.
- PWA / offline / service worker.
- i18n beyond AR + EN.
- Admin-of-admin (tenant management UI).
- Third-party analytics beyond `@vercel/analytics`.
- Observability SaaS (no Sentry, no Datadog).

---

## Data Contracts

### Transaction

```ts
type Transaction = {
  id: string; // "txn_" + ULID
  createdAt: string; // ISO-8601 UTC
  customerId: string; // FK to Customer.id
  channel: "ussd" | "app" | "web" | "pos" | "ivr";
  type: "topup" | "bundle" | "bill" | "transfer" | "refund";
  status: "succeeded" | "failed" | "pending" | "reversed";
  amountSar: number; // integer halalas (1 SAR = 100)
  governorate:
    | "riyadh"
    | "makkah"
    | "eastern"
    | "asir"
    | "madinah"
    | "qassim"
    | "hail"
    | "tabuk"
    | "najran"
    | "jazan"
    | "jouf"
    | "bahah"
    | "northern";
  failureReason?: string; // localized key, not free text
};
```

### Customer

```ts
type Customer = {
  id: string; // "cust_" + ULID
  msisdn: string; // +9665XXXXXXXX
  displayName: { ar: string; en: string };
  tier: "prepaid" | "postpaid" | "enterprise";
  governorate: Transaction["governorate"];
  joinedAt: string; // ISO
  lifetimeValueSar: number; // halalas
  status: "active" | "suspended" | "churned";
};
```

### Agent tool schema (`lib/ai/tools.ts`)

```ts
import { z } from "zod";
export const applyTransactionFilter = z.object({
  status: z.array(z.enum(["succeeded", "failed", "pending", "reversed"])).optional(),
  type: z.array(z.enum(["topup", "bundle", "bill", "transfer", "refund"])).optional(),
  channel: z.array(z.enum(["ussd", "app", "web", "pos", "ivr"])).optional(),
  governorate: z.array(z.string()).optional(),
  minAmountSar: z.number().int().nonnegative().optional(),
  maxAmountSar: z.number().int().nonnegative().optional(),
  dateFrom: z.string().datetime().optional(), // inclusive
  dateTo: z.string().datetime().optional(), // exclusive
});
export type ApplyTransactionFilter = z.infer<typeof applyTransactionFilter>;
```

### URL query-param contract (`/[locale]/transactions`)

Canonical keys, comma-separated arrays, ISO dates. This is the surface the agent writes to and the UI reads from.

```
?status=failed,pending&type=topup&minAmount=10000&dateFrom=2026-03-01&dateTo=2026-04-01&page=1&pageSize=100&sort=-createdAt
```

All query params are parsed through a single Zod schema in `lib/url/transactions-query.ts`.

---

## Brand Starter Tokens

Initial values for Phase 2. Refine after visual polish but do not block on picking them.

### Bayan (primary)

- primary: `#0B7A75` (deep teal)
- primary-contrast: `#FFFFFF`
- accent: `#E8B339` (desert gold)
- bg: `#F8FAFA` / dark `#0B1416`
- fg: `#0E1A1C` / dark `#E6EEF0`
- radius-sm/md/lg: `6px / 10px / 16px`
- spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`
- font-sans-ar: `"IBM Plex Sans Arabic"`, font-sans-en: `Inter`

### Alt (proof of multi-tenant)

- primary: `#5B4BE7` (indigo)
- accent: `#F25C54` (coral)
- otherwise inherits Bayan shape to prove token pipeline, not visual taste.

Full JSON lands in `tokens/source/bayan.json` and `tokens/source/alt.json` in Phase 2.

---

## Theme & Dark Mode

- **Modes:** `light`, `dark`, `system` (default). `system` follows `prefers-color-scheme`.
- **Implementation:** `next-themes` with `attribute="data-theme"` and `enableSystem`. Mode persists in cookie `diwan.theme` so SSR paints the correct theme on the first byte — **no flash of wrong theme**.
- **Tokens:** every color token in `tokens/source/*.json` declares both `light` and `dark` values. Style Dictionary emits CSS variables under `:root[data-theme="light"]` and `:root[data-theme="dark"]`. Brand and theme compose: `[data-brand][data-theme]`.
- **Settings UI:** new "Theme" control (Light / Dark / System) in the Settings screen.
- **Accessibility gate:** WCAG 2.1 AA contrast verified on **both themes × both brands** (4 combinations per screen). A dark-mode contrast failure fails the merge gate.
- **Charts:** Recharts series colors are driven by CSS variables so chart colors switch with theme without re-render.
- **No theme-switched raster assets** in scope — empty states remain illustration-free.
- **Wired from Phase 2**, not retrofitted. Phase 2 DoD includes "theme swap works at runtime without reload."

---

## Persisted Preferences

Three cookies power SSR-correct first paint:

- `diwan.locale` — `ar | en` (mirrors URL segment; seeded by middleware).
- `diwan.numerals` — `auto | arab | latn` (independent of locale).
- `diwan.theme` — `light | dark | system` (default `system`).
- `diwan.brand` — `bayan | alt` (default `bayan`).
- `diwan.density` — `comfortable | compact` (default `comfortable`).

All cookies are `SameSite=Lax`, `Secure` in production, read server-side in layout for SSR correctness, and mirrored to `localStorage` only for client-side instant feedback.

---

## Arabic Copy Rules

- **Dialect:** Modern Standard Arabic (فصحى) for all UI strings. No colloquial Khaliji/Egyptian dialect.
- **Register:** Formal banking/telecom tone, short sentences, active voice.
- **Numerals in UI text:** Western by default (matches banking convention); Arabic-Indic only via the Settings toggle.
- **Currency:** "ر.س" suffix or `SAR` — chosen per locale, set in `lib/formatters/currency.ts`.
- **Dates:** Never mix Hijri and Gregorian in the same sentence; respect the Settings toggle.
- **Source of truth:** `messages/ar.json` — author (native Arabic speaker = the developer) reviews every added key in the same PR that introduces the English.
- **No machine-translated strings.** If a new string is needed and Arabic isn't ready, the PR ships with a `TODO(ar):` marker and does not merge.

---

## Responsive Design Standards

**Importance.** Saudi Arabia's banking/telecom self-service traffic is ≈75% mobile. Every screen must _function_ — not just render — at every supported viewport.

**Breakpoint ladder** (Tailwind v4 defaults, overridden only if needed): `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.

**Canonical Playwright viewport projects:**

- `mobile-sm` — 360 × 740 (low-end Android, Samsung A-series class)
- `mobile` — 390 × 844 (iPhone 14)
- `tablet` — 820 × 1180 (iPad Air)
- `laptop` — 1440 × 900

**Viewport meta:** `width=device-width, initial-scale=1, viewport-fit=cover`.
**Touch targets:** all interactive elements ≥ `44 × 44` CSS px (WCAG 2.5.5 AAA / Apple HIG). `env(safe-area-inset-*)` respected on bottom nav, sheets, and dialogs.
**No hover-only affordances** — every hover reveal must have a tap/focus equivalent.
**Keyboard + pointer parity** — every mouse interaction works with keyboard.

### Per-screen responsive adaptation rules

| Screen       | ≤ `md` behavior                                                                               | ≥ `lg` behavior                                         |
| ------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Overview     | KPI cards single-column; chart tooltips constrained to viewport; legend collapses under chart | KPI grid; inline chart legends                          |
| Transactions | Grid switches to a **virtualized card-list** view; filters move to a **bottom sheet**         | Full data grid with sticky header and resizable columns |
| Customers    | Drillable list → detail push navigation                                                       | Master/detail split pane                                |
| Agent        | Input pinned to bottom with `safe-area-inset-bottom`; conversation scrolls above              | Same pattern, wider column                              |
| Settings     | Single-column stacked sections                                                                | Two-column layout (categories left, controls right)     |

**Navigation:** sidebar visible ≥ `lg`; hamburger drawer < `lg`. Drawer slides from the `inline-start` edge (side flips with `dir`).

**Visual regression merge gate:** snapshots captured at `mobile` and `laptop` for every screen × locale × brand × theme. `tablet` is spot-checked on critical screens (Transactions, Customers).

---

## Playwright RTL Assertion Utilities

`tests/e2e/utils/rtl.ts` exports:

- `expectDir(page, "rtl" | "ltr")` — asserts `<html dir>`.
- `expectInlineStart(locator, expected: "left" | "right")` — reads `getBoundingClientRect` of the locator vs its parent to confirm correct _visual_ start edge per direction.
- `expectIconFlipped(locator)` — asserts `transform: scaleX(-1)` (or absence) matches direction.
- `expectColumnOrder(grid, expectedIds[])` — reads header cell order left-to-right and compares against the locale-specific expected order.

These are required for every RTL spec to keep assertions consistent.

---

## AI Gateway Cost Controls

- `DIWAN_DAILY_TOKEN_CAP` env var (default `500000` tokens/day). On exceed, `/api/agent` returns a localized "daily demo quota reached" message.
- Cap tracked in-memory per function instance (best-effort; Fluid Compute reuse makes this workable for a demo).
- Model fixed to a cheap tier via Gateway (e.g. `anthropic/claude-haiku-4-5`). The Gateway dashboard also sets a hard monthly USD cap on the project.
- Input capped at 280 chars; output `maxOutputTokens: 400`. No long-running generation.

---

## Deployment Identity

- Vercel project slug: `diwan-rtl-dashboard`.
- Preview URLs: `diwan-rtl-dashboard-git-<branch>-<team>.vercel.app`.
- Production alias: `diwan-rtl-dashboard.vercel.app` (custom domain optional, out of scope).
- Preview deployments have `robots.ts` emit `Disallow: /` — only production indexes.
- Production region: `fra1` (Frankfurt — closest Vercel region to KSA).

---

## Git & Commit Workflow

- Branch protection on `main`: PR-only, CI must pass, linear history.
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `perf:`, `a11y:`, `i18n:`, `rtl:`, `chore:`, `docs:`, `test:`, `build:`, `ci:`.
- Commit scope used where helpful: `feat(agent):`, `a11y(grid):`, `rtl(sidebar):`.
- One logical change per commit. Small PRs preferred; each PR should be demonstrable on its preview URL.
- No squash on merge — keeps the history as a readable build log, which is itself part of the portfolio.

---

## Error Identification

- Every thrown error surface gets an `errorId` via `nanoid(10)`.
- `error.tsx` displays the id and a localized message.
- `/api/*` routes return `{ error: { code, message, errorId } }` on failure with the same id in the response header `x-error-id`.
- No Sentry; the id is for manual correlation only in the demo.

---

## Definition of Done (per phase)

Each phase exits when every bullet below is met; future sessions must not advance past a phase with unmet DoD.

- **Phase 0 — Foundations DoD:** `pnpm dev` serves `/en`; `pnpm typecheck`, `pnpm lint`, `pnpm build` all green; CI pipeline runs on a throwaway PR; Vercel preview deploys; `.env.example`, `.nvmrc`, `.npmrc` committed.
- **Phase 1 — i18n DoD:** `/ar` and `/en` both render with correct `<html dir>`; locale switch cookie persists; formatters unit-tested for both locales including Arabic-Indic digits and Hijri; no layout shift on toggle (measured in Playwright).
- **Phase 2 — Design System DoD:** `pnpm tokens:build` regenerates preset + CSS vars; brand swap **and theme swap (light/dark/system)** work at runtime with no reload and no FOUC; every shadcn primitive imported has been hand-audited for RTL and patched if needed; Ladle/Storybook shows all primitives across `ar × en × bayan × alt × light × dark`.
- **Phase 3 — AppShell DoD:** Sidebar flips side with direction; keyboard traversal hits every nav item in reading order; skip-link works; focus ring visible on all interactive elements; mobile drawer traps focus; axe clean on shell.
- **Phase 4 — Data Layer DoD:** `/api/transactions` and `/api/customers` respond to the full query contract; fixtures deterministic across cold starts; TanStack Query provider present; shared query keys typed.
- **Phase 5 — Transactions DoD:** 50k rows render at ≥55 FPS scroll on mid-tier laptop; every column filter works; keyboard nav complete; CSV export respects filters + locale; RTL column order correct; Playwright `rtl.spec.ts` and `grid-perf.spec.ts` green.
- **Phase 6 — Overview/Customers/Settings DoD:** All three screens complete in both locales and both brands; chart tooltips flip correctly; Settings preferences survive reload.
- **Phase 7 — Agent DoD:** All 6 seeded Arabic + English phrases produce the correct tool call against the real model (manual smoke) and the mocked fixture stream (automated); rate limit returns 429 under burst; cost cap enforced.
- **Phase 8 — A11y DoD:** Zero critical/serious axe violations on every screen × locale × brand × **theme**; WCAG 2.1 AA contrast verified explicitly on both themes × both brands (4 combinations per screen); manual screen-reader pass recorded in README — **Orca on Linux** is the primary manual-SR target (matches the dev environment); VoiceOver on macOS is a secondary pass if a Mac is available; NVDA on Windows is _not required_ (hardware constraint). Screen-reader assertions are automated where possible via `@guidepup/playwright` for the AR Transactions grid.
- **Phase 9 — Performance DoD:** Lighthouse ≥95 on all four axes across all five screens × two locales; `pnpm size` passes; `pnpm analyze` HTML uploaded as a CI artifact.
- **Phase 10 — Polish DoD:** README live, Loom recorded, screenshots for 5 × 2 × 2, shadcn-choice paragraph present, EPAM-context paragraph present, accessibility statement page published at `/accessibility`.
- **Phase 11 — Ship DoD:** Production URL live, TTFB <200ms from Frankfurt edge to KSA, every item in the master Verification Checklist ticked.

---

## Environment & Secrets

- Managed exclusively via `vercel env` (pull into `.env.local` via `vercel env pull`). `.env*` is gitignored; `.env.example` documents keys.
- Required keys:
  - `AI_GATEWAY_API_KEY` — Vercel AI Gateway credential. ZDR enabled on the Gateway project.
  - `AI_MODEL_ID` — default `anthropic/claude-haiku-4-5` via Gateway for cost/latency; overridable per-env.
  - `DIWAN_SEED` — fixture determinism (default `20260423`).
  - `DIWAN_RATE_LIMIT_PER_MIN` — agent endpoint cap (default `20`).
  - `DIWAN_DAILY_TOKEN_CAP` — agent daily budget (default `500000`).
- No secrets in client bundles. Any key that leaks to the client must be prefixed `NEXT_PUBLIC_` deliberately; a CI grep blocks accidental leaks of non-prefixed keys into `app/` client components.

---

## Security

- **Content Security Policy** set in `next.config.ts` headers: `default-src 'self'; connect-src 'self' https://ai-gateway.vercel.sh https://vitals.vercel-insights.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-{nonce}'; frame-ancestors 'none';` — nonce injected via middleware.
- Strict security headers: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` locked down.
- **Rate limiting on `/api/agent`** — in-memory token bucket keyed by IP (`x-forwarded-for`), falls back to a per-session cookie. `DIWAN_RATE_LIMIT_PER_MIN` enforces the ceiling. Returns `429` with localized error.
- **Prompt-injection defense on the agent:**
  - System prompt isolates user input inside a delimited block.
  - The tool schema is the _only_ channel that affects UI state — free-text output cannot mutate filters, navigate, or execute code.
  - User input is length-capped (280 chars) and stripped of control characters.
  - Tool call is validated with Zod; invalid tool calls render a localized "couldn't parse" state, never retry silently.
- **Request size** capped at 4 KB on agent route. All Route Handlers validate inputs with Zod; unknown query params rejected.
- **No PII** in fixtures — Arabic names/phones are synthetically generated from a closed dictionary; documented in `lib/fixtures/README.md`.

---

## SEO & Metadata

- `generateMetadata` per locale; titles and descriptions live in `messages/*.json`.
- `<link rel="alternate" hreflang="ar-SA" />` and `hreflang="en">` plus `x-default` on every page.
- `sitemap.ts` emits both locale variants of every route (production only).
- `robots.ts` is **environment-aware**: production (`VERCEL_ENV === "production"`) emits `Allow: /`; preview and development emit `Disallow: /` so preview URLs don't pollute search indexes. Canonical URL helpers always resolve to the production origin.
- Open Graph image generated per locale via `next/og` with the correct `dir` and font.
- Canonical URLs use the locale prefix; no duplicate-content penalties.

---

## Error & Loading UX Contract

Every route segment must provide:

- `loading.tsx` — a skeleton that matches final layout dimensions (no CLS).
- `error.tsx` — localized message, error ID, "retry" + "go home" actions, `role="alert"` live region.
- `not-found.tsx` — localized, with nav back to Overview.
  Empty states for data-driven screens (Transactions, Customers, Agent) are first-class designs, not afterthoughts — each has an illustration-free, localized, actionable empty view.

---

## Build Plan

This is the living roadmap. Phases are intentionally ordered so that each unlocks the next; do not skip ahead.

### Phase 0 — Foundations

- Scaffold Next.js 16 App Router, TypeScript strict.
- Tailwind v4 + logical-properties ESLint rule.
- ESLint (strict), Prettier, Husky + lint-staged.
- `vercel.ts` configured; link to Vercel project.
- GitHub Actions CI: typecheck, lint, unit, Playwright, Lighthouse CI.
- Fonts: IBM Plex Sans Arabic + Inter via `next/font`, self-hosted.

### Phase 1 — i18n & RTL primitives

- `next-intl`; `[locale]` segment + middleware.
- `ar.json` / `en.json` with ICU plurals.
- `<html lang dir>` wired; cookie-persisted user preference.
- `useFormatNumber`, `useFormatCurrency` (SAR), `useFormatDate` (Hijri via `islamic-umalqura`).
- Locale switcher with zero layout shift on toggle.

### Phase 2 — Design System & Tokens

- Style Dictionary pipeline, two brand token sets (`bayan`, `alt`).
- Generated Tailwind preset + `:root[data-brand]` CSS variables.
- Install shadcn/ui; audit each primitive for RTL bugs (Select, Popover alignment, Toast position) and patch in `components/ui/`.
- Ladle/Storybook wired to the token pipeline with locale + brand toolbar.

### Phase 3 — AppShell & Navigation

- Responsive shell: sidebar (`inline-start`), topbar with locale/brand/density controls.
- Keyboard nav: skip link, focus-ring system, `aria-current` on active nav.
- Mobile drawer with focus trap (react-aria `Dialog`).

### Phase 4 — Data Layer

- Seeded deterministic fixtures: 50k transactions, 2k customers.
- Route Handlers `/api/transactions`, `/api/customers` supporting `page`, `pageSize`, `sort`, `filter[...]` with simulated latency.
- TanStack Query provider, shared query keys, optimistic states defined.

### Phase 5 — Transactions Screen (the showpiece)

- TanStack Table + Virtual; 100-row pages with virtual scroll within page.
- Column header filters: text, range, select, date range.
- Keyboard: arrows, Home/End, Page Up/Down, typeahead; ARIA grid verified with NVDA + VoiceOver.
- RTL: column order flips; resize handles switch side; sort indicators flip.
- CSV export respecting current filters + locale number formatting.

### Phase 6 — Overview, Customers, Settings

- Overview: KPI cards, Recharts time-series with RTL-aware axis/tooltip, governorate stacked bar.
- Customers: virtualized master list + detail pane with RTL-correct split.
- Settings: cookie + localStorage mirror for locale, calendar, density, brand.

### Phase 7 — Agent Console (AI)

- `/api/agent` Route Handler using AI SDK v6 `streamText` with a single tool `applyTransactionFilter`.
- Model via Vercel AI Gateway (fast/cheap default, env-switchable).
- Client uses `useChat` + tool-call rendering; on tool-call, navigate to Transactions and apply filter, then stream a short narrative summary.
- Arabic + English input identically supported; few-shot prompt with Arabic examples.
- Zero Data Retention enabled on the Gateway.

### Phase 8 — Accessibility Hardening

- `@axe-core/playwright` on every screen in CI; zero critical + serious violations is the merge gate.
- Color contrast against WCAG 2.1 AA on both brands.
- Forms: `aria-describedby` error wiring, live regions for async errors.
- `prefers-reduced-motion` honored on all transitions.
- `/a11y-report` consumes the CI artifact JSON and renders it.

### Phase 9 — Performance

- Route-level code splitting audited via `next build --profile`.
- `next/image`, `next/font` with `display: swap`.
- Route-segment caching tuned: static Overview shell, dynamic tables.
- Targets on simulated 4G: LCP < 1.8s, INP < 200ms, CLS < 0.05, TTI < 2.5s.
- Lighthouse CI budgets enforced in CI.
- **Bundle budgets** — enforced in CI by **`size-limit`** (with `@size-limit/preset-app`) against the `.next/` output. `@next/bundle-analyzer` is visualization-only; `size-limit` is the gate. Config lives in `.size-limit.cjs`:
  - Initial JS per route ≤ 180 KB gz.
  - Shared chunks ≤ 110 KB gz.
  - Any single dependency ≥ 40 KB gz requires a comment in `package.json` justifying it.
  - `pnpm size` runs the check locally; CI runs it on every PR.
- Fonts subset to Arabic + Latin only; no full CJK/Cyrillic payload.

### Phase 10 — Observability & Polish

- `@vercel/analytics` + Speed Insights.
- Global ErrorBoundary with localized message + error-id surface.
- Empty / loading / error states designed per screen in both locales.
- README: live link, Loom, AR + EN screenshots across both brands, and an "EPAM Al Khobar context" paragraph.

### Phase 10.5 — Testing Matrix (formalized)

- **Unit (Jest):** formatters (number, currency, date Hijri/Gregorian), tool-schema validation, filter-spec → query-key translation, numerals cookie parsing.
- **Component (Jest + React Testing Library):** LocaleSwitcher (no layout shift), NumeralSwitcher, CalendarSwitcher, data-grid cell renderers.
- **E2E (Playwright, both locales run as a matrix):**
  - `rtl.spec.ts` — `dir` correctness, icon flips, sidebar side, table column order, scroll direction.
  - `a11y.spec.ts` — axe on every screen; zero critical/serious is the gate.
  - `grid-perf.spec.ts` — 50k dataset, scroll FPS probe via `performance.now()` sampling, filter application under 300ms.
  - `agent.spec.ts` — **mocks the AI endpoint** by intercepting `/api/agent` with a deterministic fixture stream. Six seeded Arabic + English phrases map to known tool-call payloads. Model non-determinism is eliminated in tests; the _real_ model is exercised only in manual smoke.
  - `visual.spec.ts` — Playwright screenshot snapshots for every screen × locale × brand × **theme** × two primary **viewports** (5 × 2 × 2 × 2 × 2 = **up to 80 snapshots**). Combinations that don't meaningfully differ may share a baseline — each shared baseline documented inline. RTL flips and theme swaps visible in diffs. Stored under `tests/e2e/__screenshots__/`.
- **CI matrix:** `{locale: [ar, en]} × {brand: [bayan, alt]} × {theme: [light, dark]} × {viewport: [mobile, laptop]}` on the a11y and visual suites (tablet spot-checked on critical screens).
- **Single-test invocations documented in Commands section.**

### Phase 11 — Verification (ship gate)

- Full Playwright suite green (RTL, a11y, grid perf).
- Lighthouse CI green on all five screens, both locales.
- Manual screen-reader smoke in AR: Orca on Linux (required), VoiceOver on macOS (if available). NVDA on Windows is explicitly out of scope.
- Deploy to Vercel production; verify preview → prod promotion.
- Record Loom ≤ 90s: locale toggle, Hijri date, 50k-row filter, NL agent.

---

## Commands

> Finalized when `package.json` lands in Phase 0. Expected script surface:

- `pnpm dev` — local dev server
- `pnpm build` — production build
- `pnpm start` — serve production build
- `pnpm lint` — ESLint (strict, including logical-properties rule)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` — Jest unit + component tests
  - Single file: `pnpm test lib/formatters/currency.test.ts`
  - Single test by name: `pnpm test -t "formats SAR with Arabic-Indic digits"`
  - Watch mode: `pnpm test --watch`
  - Coverage: `pnpm test --coverage`
- `pnpm test:e2e` — full Playwright suite (both locales × both brands)
  - Single spec: `pnpm test:e2e tests/e2e/rtl.spec.ts`
  - Single project/locale: `pnpm test:e2e --project=ar`
  - By tag: `pnpm test:e2e --grep "@rtl"`
  - Update visual snapshots: `pnpm test:e2e --update-snapshots`
- `pnpm test:a11y` — Playwright + axe only (`pnpm test:a11y --project=ar` for a single locale)
- `pnpm test:visual` — Playwright visual regression only
- `pnpm tokens:build` — regenerate Tailwind preset + CSS vars from `tokens/source/*.json`
- `pnpm seed` — regenerate deterministic fixtures
- `pnpm lighthouse` — local Lighthouse CI run against `pnpm build && pnpm start`
- `vercel deploy` / `vercel --prod` — deploy preview / production
- `vercel env pull` — sync env vars from Vercel into `.env.local`
- `pnpm analyze` — `@next/bundle-analyzer` report (visualization only)
- `pnpm size` — `size-limit` budget check (fails build on violation)

---

## Non-Negotiable Conventions

- **Logical properties only.** Physical-direction Tailwind utilities are forbidden; ESLint enforces this.
- **No Redux, no Context for server state.** TanStack Query is the cache.
- **Server-driven data.** Never ship large datasets to the client; paginate and filter at the Route Handler.
- **Tokens are the single source of brand truth.** Do not hardcode colors, radii, or spacing outside `tokens/source/*.json`.
- **Zero critical/serious axe violations** is a merge gate, not a nice-to-have.
- **AR/EN parity at all times.** Every merged PR must work in both locales; Playwright runs both.
- **Tool-call AI, not chatbot AI.** The agent endpoint exposes typed tools; free-text-only responses are not a feature.
- **No `.md` documentation files are created unless requested.** README and CLAUDE.md are the only doc files by default.

---

## Coverage Targets

Jest coverage is enforced per-path in `jest.config.ts` via `coverageThreshold`. Targets are a floor, not a goal — do not chase 100%; it produces brittle tests on UI polish code.

| Path                                           | Statements          | Branches                          | Notes                                                                                                                     |
| ---------------------------------------------- | ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `lib/**`                                       | **≥90%**            | **≥85%**                          | Pure logic: formatters, i18n helpers, tool schemas, URL parsers, fixture generators. Highest leverage, cheapest to test.  |
| `components/ui/**`                             | **≥70%**            | **100% of RTL-affected branches** | Unit tests must focus on the _reason these files exist_ — the RTL patches over shadcn. Visual/a11y covered by Playwright. |
| `components/data-grid/**`                      | **≥75%**            | **≥70%**                          | Cell renderers and keyboard logic unit-tested here; scroll/virtualization in Playwright.                                  |
| `components/layout/**`, `components/locale/**` | **≥60%**            | —                                 | Integration covered by Playwright; unit tests cover pure helpers only.                                                    |
| `components/charts/**`                         | **≥60%**            | —                                 | RTL axis-flip logic covered; Recharts internals excluded.                                                                 |
| **Overall workspace**                          | **≥75% statements** | —                                 | Headline number. Anything above ~85% on a project like this means you're testing noise.                                   |

### Explicitly excluded from coverage denominator

- `app/**/page.tsx`, `app/**/layout.tsx`, `app/**/loading.tsx`, `app/**/error.tsx`, `app/**/not-found.tsx` — RSC/JSX shells covered by Playwright.
- `app/**/route.ts` — Route Handlers covered by Playwright + integration tests where relevant.
- `tokens/build/**` — generated output.
- `**/*.d.ts`, `**/*.stories.tsx`, `**/__mocks__/**`, `**/*.config.*`.
- `messages/**` — pure JSON dictionaries.

### E2E flow coverage (Playwright, not Jest)

Not a percentage — a discrete checklist:

- Every merged screen has at least one `rtl.spec.ts`, `a11y.spec.ts`, and `visual.spec.ts` assertion.
- Critical flows have dedicated specs: Transactions filter → apply → CSV export; AR natural-language query → tool call → filter applied → summary streamed.
- Every user-facing error state (404, 500, empty, loading) has a visual snapshot in both locales.

---

## Merge Gates (enforced by CI, not by humans)

A PR **cannot merge** unless all of the following are green:

1. `pnpm typecheck`
2. `pnpm lint` (including the logical-properties rule)
3. `pnpm test` — Jest unit + component, coverage thresholds per the "Coverage Targets" table must pass
4. `pnpm test:e2e` on the full matrix (locales × brands)
5. `pnpm test:a11y` — zero critical or serious violations
6. `pnpm test:visual` — snapshots match (intentional changes require a commit updating them)
7. `pnpm size` — size-limit budgets met (`pnpm analyze` is informational only)
8. Lighthouse CI — ≥95 on all four axes across all five screens in both locales
9. No secrets leaked (CI grep for common key shapes)

A `.github/pull_request_template.md` surfaces a short checklist, but the gate is automated.

---

## Critical Files

- `app/[locale]/layout.tsx` — root direction/lang wiring (most load-bearing single file)
- `middleware.ts` — locale negotiation
- `lib/i18n/request.ts` — next-intl server config
- `components/ui/*` — RTL-patched shadcn primitives
- `components/data-grid/*` — the 50k-row showpiece
- `lib/ai/tools.ts` — the Zod-typed tool schema powering the agent
- `tokens/source/*.json` + `scripts/build-tokens.ts` — design-system source of truth
- `vercel.ts` — deployment config
- `.github/workflows/ci.yml` — typecheck, lint, Jest, Playwright, Lighthouse CI, axe, bundle analyze + size-limit gate, secret-leak grep
- `next.config.ts` — security headers, CSP with nonce, image domains
- `.env.example` — documented env keys
- `.nvmrc`, `.npmrc` — pinned runtime/package-manager

---

## Verification Checklist

- [ ] `pnpm dev` runs; `/ar` and `/en` both load with correct `dir`.
- [ ] `pnpm test` and `pnpm test:e2e` green locally and in CI.
- [ ] `pnpm lighthouse` ≥95 on all four axes across all five screens, both locales.
- [ ] `pnpm test:a11y` reports zero critical/serious violations.
- [ ] Transactions screen: 50k rows, scroll FPS ≥55 on mid-tier laptop.
- [ ] Brand swap completes in a single paint (<16ms) with no reload.
- [ ] Hijri date picker round-trips 1 Ramadan 1446 ↔ 1 Mar 2025 correctly.
- [ ] Arabic NL query on agent produces correct filter spec on 6 seeded test phrases.
- [ ] Vercel production URL <200ms TTFB from EU/ME edge.
- [ ] README + Loom link present in repo root.
- [ ] CSP headers present (verify via `curl -I` on production URL).
- [ ] `/api/agent` returns `429` under burst load (6 requests in <1s from the same IP).
- [ ] hreflang tags present on every page; sitemap.xml lists both locales.
- [ ] `loading.tsx`, `error.tsx`, `not-found.tsx` exist for every route segment.
- [ ] Bundle budgets met on `pnpm size` (size-limit).
- [ ] Visual snapshots cover 5 screens × 2 locales × 2 brands × 2 themes × 2 viewports (up to 80 baselines; shared baselines documented).
- [ ] Theme swap (light ↔ dark ↔ system) works without reload or FOUC; `diwan.theme` cookie persists across refresh.
- [ ] Dark-mode WCAG AA contrast verified on every screen × brand.
- [ ] Transactions screen card-list view renders at `mobile` (≤ md) with filter bottom sheet functional.
- [ ] Customers screen stacks to drillable list→detail at `mobile`.
- [ ] Every phase's DoD bullets (see "Definition of Done") ticked off in order.
- [ ] Data contract schemas (`Transaction`, `Customer`, `applyTransactionFilter`, URL query params) implemented exactly as specified.
- [ ] Scope-cut list respected — no auth, no real DB, no PWA/service-worker code in the repo.
- [ ] Preview URLs return `Disallow: /` in robots; production indexes.
- [ ] `/accessibility` statement page present and localized.
- [ ] AI Gateway cost cap verified (enforce on burst test).
- [ ] All interactive elements ≥44×44 px at mobile breakpoints.

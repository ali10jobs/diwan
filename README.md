# Diwan

A bilingual (Arabic / English), RTL-first enterprise dashboard for **Bayan Telecom** — a fictional KSA carrier — built as a job-application artifact targeting EPAM Systems' Senior Frontend Developer role in Al Khobar.

- **Live:** _add Vercel URL after Phase 11 deploy_
- **Loom (≤90s walkthrough):** _add link after recording_
- **Repo:** [github.com/ali10jobs/diwan](https://github.com/ali10jobs/diwan)
- **Accessibility statement:** [`/accessibility`](./app/[locale]/accessibility/page.tsx)
- **CI accessibility report:** [`/a11y-report`](./app/[locale]/a11y-report/page.tsx) (driven by `public/a11y-report.json`)

---

## Why this exists

EPAM's KSA offices deliver enterprise portals to Forbes-2000 clients (banks, telecom, the Aramco ecosystem). Five problems show up on every engagement and rarely get solved well:

1. **RTL + bilingual parity** — not just translated strings, but mirrored iconography, calendar systems (Hijri / Gregorian), Arabic-Indic vs Western digits, and layout that flips correctly the first time.
2. **Accessibility on regulated enterprise UIs** — WCAG AA isn't a nice-to-have; it's a contractual obligation.
3. **Performance on data-heavy admin screens** — 50 K-row tables need to feel instant, not "good enough."
4. **Repeated design-system reinvention per client** — multi-tenant theming via tokens, not forks.
5. **AI-native UX patterns grounded in real tool-use** rather than bolt-on chatbots.

Diwan is a single deployable artifact that takes a position on each.

---

## Screens

| Route                     | Purpose                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `/[locale]`               | **Overview** — KPI cards, daily revenue time-series, governorate stacked bar.                  |
| `/[locale]/transactions`  | **Transactions** — 50 K-row server-driven table, virtualized, full keyboard nav, CSV export.   |
| `/[locale]/customers`     | **Customers** — virtualized master list + RTL-correct split-pane detail.                       |
| `/[locale]/agent`         | **Agent Console** — natural-language AR/EN prompt → Zod-typed tool call → Transactions filter. |
| `/[locale]/settings`      | Locale, calendar, numerals, theme, brand, density.                                             |
| `/[locale]/accessibility` | Bilingual accessibility statement.                                                             |
| `/[locale]/a11y-report`   | Latest CI axe results (40 combinations: 5 screens × 2 locales × 2 brands × 2 themes).          |

---

## Stack

- **Next.js 16** (App Router, Turbopack) on **Node 24 LTS**, deployed to Vercel Fluid Compute.
- **TypeScript strict**, **Tailwind v4** (logical properties only — `ps-*` / `pe-*`, never `pl-*`/`pr-*`; ESLint enforces it).
- **shadcn/ui + Radix** primitives, RTL-audited and patched in-repo.
- **TanStack Table v8 + TanStack Virtual** for the 50 K-row grid.
- **TanStack Query v5** for server-state caching.
- **Recharts** wrapped in an `<RtlChart>` that flips axis order in RTL.
- **next-intl** for ICU-formatted Arabic + English dictionaries.
- **AI SDK v6** via the **Vercel AI Gateway** for the agent route.
- **Style Dictionary** → Tailwind preset + CSS variables for multi-brand theming.
- **Jest + React Testing Library** + **Playwright + axe-core** for tests.

---

## Why shadcn/ui (and not MUI / Ant / PrimeNG)

EPAM's job description names MUI, Ant Design, and PrimeNG as the libraries on most engagements. Diwan deliberately uses **shadcn/ui** instead. The reasoning:

- **Ownable primitives.** shadcn copies components into `components/ui/`. The RTL patches, ARIA contracts, and token wiring are inspectable in _this_ repository — not buried in vendor theming.
- **Best-in-class a11y.** Radix powers shadcn; it's the closest thing to a guaranteed pass on the zero-critical/serious axe gate.
- **Tailwind v4 + logical properties** compose natively with shadcn but fight MUI's Emotion runtime and Ant's CSS-in-JS.
- **Bundle budget.** The MUI / Ant baselines push hard against Diwan's 180 KB-per-route gz target; shadcn ships only what's imported.
- **Real RTL bugs.** MUI's Popover, Menu, and DataGrid resize handles have known RTL alignment issues; we'd be forking anyway.

The discipline here — RTL-correct primitives, token-driven theming, zero-violation a11y — translates **directly** to MUI's `ThemeProvider`, Ant's `ConfigProvider`, or PrimeNG's CSS variables on a client engagement. Only the vendor surface changes.

---

## Local development

```bash
nvm use 24
pnpm install
vercel env pull   # AI Gateway key + demo limits
pnpm dev
```

Key URLs once `pnpm dev` is running:

- `http://localhost:3000/en` and `http://localhost:3000/ar`
- `http://localhost:3000/en/transactions?status=failed&type=topup` — the URL is the source of truth for filters
- `http://localhost:3000/en/agent` — try `"failed top-ups in Riyadh over 100 SAR last week"` or `"اعرض المعاملات الفاشلة في المنطقة الشرقية"`

---

## Testing & gates

| Command            | What it covers                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`   | `tsc --noEmit` strict.                                                                                                             |
| `pnpm lint`        | ESLint, including the logical-properties rule that bans `pl-*`/`pr-*`/`ml-*`/`left-*`/`right-*`.                                   |
| `pnpm test`        | Jest unit + component tests (currently 56 / 56 across 11 suites).                                                                  |
| `pnpm test:e2e`    | Playwright across `laptop` + `mobile` projects (135+ specs covering RTL, a11y, perf, agent, security headers).                     |
| `pnpm a11y:report` | Standalone Playwright run that walks every screen × locale × brand × theme (40 combinations) and writes `public/a11y-report.json`. |
| `pnpm size`        | `size-limit` budget gate — total client JS ≤ 650 KB gz, total CSS ≤ 30 KB gz.                                                      |
| `pnpm size:report` | Per-chunk visibility (top 15 client JS chunks by gzipped size).                                                                    |
| `pnpm analyze`     | `@next/bundle-analyzer` HTML report (visualization only).                                                                          |
| `pnpm lighthouse`  | Lighthouse CI assertions against the production build (≥0.95 on all four axes, 10 URLs).                                           |

**Merge gate (CI):** typecheck + lint + jest with coverage thresholds + full Playwright matrix + zero critical/serious axe violations + `pnpm size` + Lighthouse CI ≥0.95 + secret-leak grep.

---

## Manual screen-reader passes

Per CLAUDE.md → Phase 8 DoD, manual screen-reader smoke is required:

- **Orca on Linux** — primary target (matches the dev environment). Recorded against the AR Transactions grid before each release.
- **VoiceOver on macOS** — secondary; run when a Mac is available.
- **NVDA on Windows** — out of scope (the developer doesn't run Windows hardware).

The automated portion lives in `tests/e2e/a11y.spec.ts` and `tests/e2e/a11y-contrast.spec.ts`.

---

## Architecture decisions worth flagging

- **Server-driven everything.** Transactions and Customers paginate / filter on the server via Route Handlers. No 50K payload ever ships to the client. The agent emits a _filter spec_, not results — the UI re-queries the same endpoint everyone else hits.
- **Locale is a route segment** (`/ar/...`, `/en/...`). Middleware negotiates via `Accept-Language` + cookie. `dir` is set on `<html>` in `[locale]/layout.tsx`. Numerals (Arabic-Indic / Western) and calendar (Hijri / Gregorian) are decoupled from locale via separate cookies.
- **Tokens are the single source of brand truth.** `pnpm tokens:build` regenerates a Tailwind preset + CSS variables from `tokens/source/*.json`. Brand swap at runtime is a CSS-variable change at `:root[data-brand="..."]` — no rebuild.
- **AI is a tool-user, not a text-generator.** `/api/agent` exposes one Zod-typed tool, `applyTransactionFilter`. The model fills the schema; the client validates it through the same schema and pushes to `/transactions` with the URL contract everyone else uses.
- **Mock the backend, not the pattern.** Route handlers read from a deterministic 50K-row in-memory dataset (seed `DIWAN_SEED=20260423`), behaving like a real paginated REST API with simulated 80–200 ms latency.

---

## Repository layout

The `CLAUDE.md` file at the repo root is the canonical project spec — phases, DoD per phase, scope cuts, data contracts, conventions. Worth reading first.

```
app/                 # Next.js App Router routes (locale-prefixed)
components/          # UI: layout, charts, customers, agent, data-grid, locale, theme
lib/                 # i18n, formatters, fixtures, AI tools, a11y helpers, URL parsers
tokens/source/       # Per-brand JSON; build with `pnpm tokens:build`
tests/e2e/           # Playwright (RTL, a11y, perf, agent, security headers)
tests/unit/          # Jest (formatters, schemas, AI helpers)
tests/a11y-report/   # Standalone CI artifact producer
scripts/             # build-tokens, seed-fixtures, size-report
messages/            # ar.json + en.json (ICU MessageFormat)
```

---

## License

This repository is a personal portfolio artifact. All code is original; the "Bayan Telecom" name and brand are fictional. Customer data is synthetic (deterministic generator under `lib/fixtures/`).

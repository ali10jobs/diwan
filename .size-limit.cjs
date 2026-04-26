// Size budgets per CLAUDE.md → "Phase 9 → Bundle budgets". `size-limit`
// is the merge gate; `@next/bundle-analyzer` is visualization-only.
//
// Turbopack emits chunks with opaque hashed names rather than a tidy
// per-route file tree, so we track holistic budgets — total client
// JS (gzipped) and total CSS — instead of per-route splits. The
// per-route ≤180 KB DoD target is verified manually against the
// `next build` summary table; this gate catches gross regressions
// across builds without depending on chunk-name conventions.

module.exports = [
  {
    name: "all client JS chunks",
    path: ".next/static/chunks/**/*.js",
    limit: "650 KB",
    gzip: true,
  },
  {
    name: "all CSS",
    path: ".next/static/chunks/**/*.css",
    limit: "30 KB",
    gzip: true,
  },
];

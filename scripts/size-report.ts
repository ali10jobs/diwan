import { promises as fs } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

// Per-chunk size breakdown.
//
// Note: Turbopack + Next.js App Router emit chunks with opaque hashed
// filenames and do not produce a per-route client manifest in a stable,
// public format. Strict per-route ≤180 KB gz gating is therefore done
// against the `next build` summary table by hand — this script gives
// visibility into the *largest* chunks so a regression has a clear
// suspect, even if we can't attribute it to a single route automatically.

type Row = { file: string; bytes: number; gzipped: number };

async function fileSizes(dir: string, ext: string): Promise<Row[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const rows: Row[] = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      rows.push(...(await fileSizes(path.join(dir, e.name), ext)));
      continue;
    }
    if (!e.name.endsWith(ext)) continue;
    const full = path.join(dir, e.name);
    const buf = await fs.readFile(full);
    rows.push({ file: full, bytes: buf.length, gzipped: gzipSync(buf).length });
  }
  return rows;
}

function fmt(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(2)} KB`;
}

async function main(): Promise<void> {
  const chunks = path.join(process.cwd(), ".next", "static", "chunks");
  const js = (await fileSizes(chunks, ".js")).sort((a, b) => b.gzipped - a.gzipped);
  const css = await fileSizes(chunks, ".css");

  const totalJs = js.reduce((s, r) => s + r.gzipped, 0);
  const totalCss = css.reduce((s, r) => s + r.gzipped, 0);

  console.log("Top 15 JS chunks (by gzipped size):");
  for (const r of js.slice(0, 15)) {
    const rel = path.relative(process.cwd(), r.file);
    console.log(`  ${fmt(r.gzipped).padStart(10)}  ${fmt(r.bytes).padStart(10)}  ${rel}`);
  }
  console.log(`\nTotals (gzipped):`);
  console.log(`  JS:  ${fmt(totalJs)} across ${js.length} files`);
  console.log(`  CSS: ${fmt(totalCss)} across ${css.length} files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

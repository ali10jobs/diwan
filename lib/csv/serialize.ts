// Minimal RFC-4180 CSV writer. Hand-rolled because the project's
// constraint is "ownable primitives" — a 30-line helper beats pulling
// `papaparse` (~40 KB) for one route.

const NEEDS_QUOTING = /[",\r\n]/;

export function csvEscape(value: string): string {
  if (!NEEDS_QUOTING.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/** Joins a row's cells with `,` and terminates with CRLF (RFC-4180). */
export function csvRow(cells: readonly string[]): string {
  return `${cells.map(csvEscape).join(",")}\r\n`;
}

/** UTF-8 BOM. Excel needs it to auto-detect non-ASCII (e.g. Arabic)
 * when opening a `.csv`. Harmless for everything else. */
export const UTF8_BOM = "﻿";

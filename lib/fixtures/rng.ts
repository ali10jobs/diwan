import seedrandom from "seedrandom";

// Single module-cached RNG seeded from DIWAN_SEED (default 20260423 per
// CLAUDE.md). Fluid Compute reuses the function instance across
// concurrent requests, so the 50k + 2k rows materialize once per warm
// function, not per request. Cold starts regenerate deterministically.

const SEED = process.env.DIWAN_SEED ?? "20260423";
const prng = seedrandom(SEED);

/** Uniform [0, 1) from the seeded stream. */
export function rand(): number {
  return prng();
}

/** Inclusive integer range [min, max]. */
export function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/** Pick one element. Weighted variant elsewhere. */
export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]!;
}

/** Weighted pick: `[value, weight][]`, weights need not sum to 1. */
export function weightedPick<T>(pairs: readonly (readonly [T, number])[]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r < 0) return v;
  }
  return pairs[pairs.length - 1]![0];
}

/** Deterministic "ULID-ish" id: 26 chars of Crockford base32 with a
 * monotonically increasing prefix so a collection stays sortable by id. */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function makeId(prefix: string, index: number): string {
  // High 10 chars: index in base32, zero-padded.
  const head = index.toString(32).padStart(10, "0").toUpperCase();
  // Low 16 chars: random from the stream.
  let tail = "";
  for (let i = 0; i < 16; i++) tail += CROCKFORD[Math.floor(rand() * 32)];
  return `${prefix}_${head}${tail}`;
}

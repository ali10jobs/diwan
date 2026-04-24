/** Simulate 80–200ms network latency so the UI never sees an
 * impossibly-fast mock and loading states actually exercise. Uses
 * `Math.random` (not the fixture PRNG) so latency varies between
 * requests without affecting the deterministic dataset. */
export function simulatedLatency(): Promise<void> {
  const ms = 80 + Math.floor(Math.random() * 120);
  return new Promise((r) => setTimeout(r, ms));
}

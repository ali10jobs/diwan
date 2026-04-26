// Per-instance daily token cap. Combined with the Gateway's hard USD
// ceiling, this keeps demo cost predictable.

let dayKey = currentDayKey();
let consumed = 0;

function currentDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isQuotaExceeded(cap: number): boolean {
  rolloverIfNewDay();
  return consumed >= cap;
}

export function recordTokens(used: number): void {
  rolloverIfNewDay();
  consumed += Math.max(0, used);
}

export function getConsumedForTests(): number {
  return consumed;
}

export function __resetQuotaForTests(): void {
  consumed = 0;
  dayKey = currentDayKey();
}

function rolloverIfNewDay(): void {
  const today = currentDayKey();
  if (today !== dayKey) {
    dayKey = today;
    consumed = 0;
  }
}

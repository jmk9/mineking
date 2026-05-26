const KEY = 'ms_coins_v1';

export function loadCoins(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw == null ? 0 : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveCoins(coins: number): void {
  try {
    localStorage.setItem(KEY, String(coins));
  } catch {
    // ignore storage errors (private mode, quota)
  }
}

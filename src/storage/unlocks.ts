const KEY = 'ms_unlocked_themes_v1';

/** Preset theme ids the player owns. Free (tier 0) themes are always owned. */
export function loadUnlocks(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return ['classic'];
    const ids = JSON.parse(raw);
    const list = Array.isArray(ids) ? (ids as string[]) : [];
    return list.includes('classic') ? list : ['classic', ...list];
  } catch {
    return ['classic'];
  }
}

export function saveUnlocks(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

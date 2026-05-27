import { defaultProgress } from '../progress/engine';
import { emptyStats, type PlayerProgress } from '../progress/types';

const KEY = 'ms_progress_v1';

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    const p = JSON.parse(raw) as Partial<PlayerProgress>;
    const base = defaultProgress();
    return {
      xp: typeof p.xp === 'number' ? p.xp : 0,
      stats: { ...emptyStats(), ...(p.stats ?? {}) },
      achievements: p.achievements ?? {},
      perksEquipped: Array.isArray(p.perksEquipped) ? p.perksEquipped : [],
      daily: p.daily ?? base.daily,
      displayName: typeof p.displayName === 'string' ? p.displayName : undefined,
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: PlayerProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore storage errors
  }
}

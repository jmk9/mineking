import type { AdventureRun } from '../dungeon/types';

const KEY = 'ms_dungeon_run_v1';

/** Load the run currently in progress, or null if none / on parse error. */
export function loadDungeonRun(): AdventureRun | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdventureRun;
    if (typeof parsed.dungeonId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDungeonRun(run: AdventureRun): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(run));
  } catch {
    // ignore storage errors
  }
}

export function clearDungeonRun(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

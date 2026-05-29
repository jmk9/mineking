import { getDungeon } from '../dungeon/catalog';
import type { AdventureRun } from '../dungeon/types';

const KEY = 'ms_dungeon_run_v1';

/**
 * Load the run currently in progress. Returns null for: no saved run, parse
 * error, or a saved run whose dungeonId is no longer in the catalog (can
 * happen when ids are renamed across releases — we drop the stale run rather
 * than crash the UI).
 */
export function loadDungeonRun(): AdventureRun | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdventureRun;
    if (typeof parsed.dungeonId !== 'string') return null;
    if (!getDungeon(parsed.dungeonId)) {
      localStorage.removeItem(KEY);
      return null;
    }
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

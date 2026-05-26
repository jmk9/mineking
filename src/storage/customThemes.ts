import type { Theme } from '../render/theme';

const KEY = 'ms_custom_themes_v1';

export function loadCustomThemes(): Theme[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Theme[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomThemes(themes: Theme[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(themes));
  } catch {
    // ignore storage errors
  }
}

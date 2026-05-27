const THEME_KEY = 'ms_theme_v1';
const LOUPE_ENABLED_KEY = 'ms_loupe_enabled_v1';

export function loadThemeId(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function saveThemeId(id: string): void {
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    // ignore storage errors
  }
}

export function loadLoupeEnabled(): boolean {
  try {
    const v = localStorage.getItem(LOUPE_ENABLED_KEY);
    return v == null ? true : v === '1';
  } catch {
    return true;
  }
}

export function saveLoupeEnabled(v: boolean): void {
  try {
    localStorage.setItem(LOUPE_ENABLED_KEY, v ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

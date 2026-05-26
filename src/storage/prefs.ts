const THEME_KEY = 'ms_theme_v1';

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

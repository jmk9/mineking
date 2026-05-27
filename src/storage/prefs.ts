const THEME_KEY = 'ms_theme_v1';
const ZOOM_ENABLED_KEY = 'ms_zoom_enabled_v1';

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

export function loadZoomEnabled(): boolean {
  try {
    const v = localStorage.getItem(ZOOM_ENABLED_KEY);
    return v == null ? true : v === '1';
  } catch {
    return true;
  }
}

export function saveZoomEnabled(v: boolean): void {
  try {
    localStorage.setItem(ZOOM_ENABLED_KEY, v ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

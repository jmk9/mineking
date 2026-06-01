const THEME_KEY = 'ms_theme_v1';
const LOUPE_ENABLED_KEY = 'ms_loupe_enabled_v1';
const BGM_ENABLED_KEY = 'ms_bgm_enabled_v1';
const BGM_VOLUME_KEY = 'ms_bgm_volume_v1';
const SFX_ENABLED_KEY = 'ms_sfx_enabled_v1';
const START_MODE_KEY = 'ms_start_mode_v1';

export type StartMode = 'open' | 'flag';

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

export function loadBgmEnabled(): boolean {
  try {
    const v = localStorage.getItem(BGM_ENABLED_KEY);
    return v == null ? true : v === '1';
  } catch {
    return true;
  }
}

export function saveBgmEnabled(v: boolean): void {
  try {
    localStorage.setItem(BGM_ENABLED_KEY, v ? '1' : '0');
  } catch {
    // ignore
  }
}

export function loadBgmVolume(): number {
  try {
    const raw = localStorage.getItem(BGM_VOLUME_KEY);
    if (raw == null) return 60;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 60;
  } catch {
    return 60;
  }
}

export function saveBgmVolume(v: number): void {
  try {
    localStorage.setItem(BGM_VOLUME_KEY, String(Math.max(0, Math.min(100, v))));
  } catch {
    // ignore
  }
}

export function loadSfxEnabled(): boolean {
  try {
    const v = localStorage.getItem(SFX_ENABLED_KEY);
    return v == null ? true : v === '1';
  } catch {
    return true;
  }
}

export function saveSfxEnabled(v: boolean): void {
  try {
    localStorage.setItem(SFX_ENABLED_KEY, v ? '1' : '0');
  } catch {
    // ignore
  }
}

export function loadStartMode(): StartMode {
  try {
    const v = localStorage.getItem(START_MODE_KEY);
    return v === 'flag' ? 'flag' : 'open';
  } catch {
    return 'open';
  }
}

export function saveStartMode(v: StartMode): void {
  try {
    localStorage.setItem(START_MODE_KEY, v);
  } catch {
    // ignore
  }
}

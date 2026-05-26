import { shade, luminance } from './color';
import type { FlagShape, Theme } from './theme';

/** The fields a user actually edits; the rest of a Theme is derived. */
export interface ThemeDraft {
  name: string;
  flagShape: FlagShape;
  bg: string;
  hidden: string;
  revealed: string;
  flag: string;
  numberColors: Record<number, string>;
  numberImages: Record<number, string>; // n -> data URL (only set entries override)
  flagImage?: string;
}

/** Border contrasts against its tile: lighten dark tiles, darken light ones. */
function borderFor(tile: string): string {
  return luminance(tile) < 128 ? shade(tile, 18) : shade(tile, -18);
}

export function draftFromTheme(theme: Theme): ThemeDraft {
  return {
    name: `${theme.name} 복사본`,
    flagShape: theme.flagShape,
    bg: theme.bg,
    hidden: theme.hidden,
    revealed: theme.revealed,
    flag: theme.flag,
    numberColors: { ...theme.numberColors },
    numberImages: { ...(theme.numberImages ?? {}) },
    flagImage: theme.flagImage,
  };
}

export function buildCustomTheme(draft: ThemeDraft, id: string): Theme {
  const dark = luminance(draft.bg) < 128;
  return {
    id,
    name: draft.name.trim() || '내 테마',
    tier: 2,
    bg: draft.bg,
    hidden: draft.hidden,
    hiddenBorder: borderFor(draft.hidden),
    revealed: draft.revealed,
    revealedBorder: borderFor(draft.revealed),
    flag: draft.flag,
    flagPole: dark ? '#e2e8f0' : '#1a1a1a',
    flagShape: draft.flagShape,
    mine: draft.bg,
    mineHitBg: '#b91c1c',
    numberColors: { ...draft.numberColors },
    numberImages: Object.keys(draft.numberImages).length ? { ...draft.numberImages } : undefined,
    flagImage: draft.flagImage,
    // Derive a matching app-UI palette from the board colors so the whole app reskins.
    ui: {
      bg: dark ? shade(draft.bg, -10) : shade(draft.bg, 6),
      bg2: dark ? shade(draft.bg, 12) : shade(draft.bg, -4),
      panel: dark ? shade(draft.bg, 14) : '#ffffff',
      panelBorder: dark ? shade(draft.bg, 28) : shade(draft.bg, -12),
      text: dark ? '#e8eefb' : '#2a2230',
      muted: dark ? '#93a4c2' : '#8a7d92',
      accent: draft.flag,
      accentText: luminance(draft.flag) < 140 ? '#ffffff' : '#1a1a1a',
    },
  };
}

export function isCustom(id: string): boolean {
  return id.startsWith('custom:');
}

export function newCustomId(): string {
  return `custom:${Date.now()}`;
}

/**
 * A theme controls the look of the board: tile colors, number colors, and the
 * flag/mine glyphs. Presets live in `presets.ts`. The custom editor (M4) will
 * produce themes of this same shape, so the renderer never needs to change.
 */
export type FlagShape = 'triangle' | 'pennant' | 'banner';

/** Palette that skins the whole app UI (not just the board). */
export interface UIPalette {
  bg: string; // page background base
  bg2: string; // gradient accent for the background
  panel: string; // cards / controls
  panelBorder: string;
  text: string;
  muted: string;
  accent: string; // primary action / active state
  accentText: string; // text on accent
}

export interface Theme {
  id: string;
  name: string;
  tier: 0 | 1 | 2 | 3;
  bg: string;
  hidden: string;
  hiddenBorder: string;
  revealed: string;
  revealedBorder: string;
  flag: string;
  flagPole: string;
  flagShape: FlagShape;
  mine: string;
  mineHitBg: string;
  numberColors: Record<number, string>; // 1-8
  ui: UIPalette;
  // Optional custom glyph images (data URLs). When set, drawn instead of the
  // default text number / shape flag.
  numberImages?: Record<number, string>;
  flagImage?: string;
}

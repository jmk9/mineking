import type { Theme } from './theme';

export const PRESETS: Theme[] = [
  {
    id: 'classic',
    name: '클래식',
    tier: 0,
    bg: '#0f172a',
    hidden: '#475569',
    hiddenBorder: '#64748b',
    revealed: '#1e293b',
    revealedBorder: '#334155',
    flag: '#ef4444',
    flagPole: '#e2e8f0',
    flagShape: 'triangle',
    mine: '#0f172a',
    mineHitBg: '#b91c1c',
    numberColors: {
      1: '#60a5fa', 2: '#4ade80', 3: '#f87171', 4: '#c084fc',
      5: '#fb923c', 6: '#22d3ee', 7: '#e2e8f0', 8: '#94a3b8',
    },
    ui: {
      bg: '#0b1120', bg2: '#16233f', panel: '#141f33', panelBorder: '#243049',
      text: '#e8eefb', muted: '#8aa0c0', accent: '#38bdf8', accentText: '#04263a',
    },
  },
  {
    id: 'retro',
    name: '레트로',
    tier: 1,
    bg: '#c0c0c0',
    hidden: '#bdbdbd',
    hiddenBorder: '#7d7d7d',
    revealed: '#d9d9d9',
    revealedBorder: '#a8a8a8',
    flag: '#d40000',
    flagPole: '#1a1a1a',
    flagShape: 'banner',
    mine: '#111111',
    mineHitBg: '#ff5252',
    numberColors: {
      1: '#0000ff', 2: '#008000', 3: '#ff0000', 4: '#000080',
      5: '#800000', 6: '#008080', 7: '#000000', 8: '#808080',
    },
    ui: {
      bg: '#1b2733', bg2: '#2a4055', panel: '#27323d', panelBorder: '#43525f',
      text: '#eef2f6', muted: '#9fb2c2', accent: '#d40000', accentText: '#ffffff',
    },
  },
  {
    id: 'pastel',
    name: '파스텔',
    tier: 1,
    bg: '#fdf2f8',
    hidden: '#fbcfe8',
    hiddenBorder: '#f9a8d4',
    revealed: '#fff7fb',
    revealedBorder: '#fbcfe8',
    flag: '#fb7185',
    flagPole: '#a78bfa',
    flagShape: 'pennant',
    mine: '#9d174d',
    mineHitBg: '#fda4af',
    numberColors: {
      1: '#3b82f6', 2: '#10b981', 3: '#f43f5e', 4: '#8b5cf6',
      5: '#f59e0b', 6: '#06b6d4', 7: '#ec4899', 8: '#6b7280',
    },
    ui: {
      bg: '#fff1f7', bg2: '#ffe4ef', panel: '#ffffff', panelBorder: '#fbcfe8',
      text: '#5b3a52', muted: '#b07f9c', accent: '#fb7185', accentText: '#ffffff',
    },
  },
  {
    id: 'neon',
    name: '네온',
    tier: 1,
    bg: '#0a0a12',
    hidden: '#1b1b2f',
    hiddenBorder: '#3a3a6a',
    revealed: '#101020',
    revealedBorder: '#2a2a4a',
    flag: '#f0f',
    flagPole: '#0ff',
    flagShape: 'pennant',
    mine: '#0a0a12',
    mineHitBg: '#7a0040',
    numberColors: {
      1: '#00e5ff', 2: '#39ff14', 3: '#ff3caa', 4: '#b14bff',
      5: '#ffae00', 6: '#00ffd0', 7: '#ff5edb', 8: '#7df9ff',
    },
    ui: {
      bg: '#07070f', bg2: '#1a0a2e', panel: '#12122a', panelBorder: '#2c2c5e',
      text: '#dbe6ff', muted: '#8089c8', accent: '#ff2bd6', accentText: '#0a0512',
    },
  },
  {
    id: 'forest',
    name: '포레스트',
    tier: 1,
    bg: '#1a2e1a',
    hidden: '#3f6b3f',
    hiddenBorder: '#5c8a5c',
    revealed: '#24402a',
    revealedBorder: '#3a5a3f',
    flag: '#f59e0b',
    flagPole: '#d6c08a',
    flagShape: 'banner',
    mine: '#1a2e1a',
    mineHitBg: '#92400e',
    numberColors: {
      1: '#7dd3fc', 2: '#bef264', 3: '#fca5a5', 4: '#d8b4fe',
      5: '#fcd34d', 6: '#5eead4', 7: '#fde68a', 8: '#cbd5e1',
    },
    ui: {
      bg: '#13241a', bg2: '#1f3a26', panel: '#1d3324', panelBorder: '#34503b',
      text: '#e9f2ea', muted: '#9cb8a4', accent: '#f59e0b', accentText: '#1a2e12',
    },
  },
  {
    id: 'ocean',
    name: '오션',
    tier: 1,
    bg: '#082f49',
    hidden: '#0e5a7d',
    hiddenBorder: '#1c7ba3',
    revealed: '#0c4a6e',
    revealedBorder: '#155e83',
    flag: '#fde047',
    flagPole: '#e0f2fe',
    flagShape: 'triangle',
    mine: '#082f49',
    mineHitBg: '#0369a1',
    numberColors: {
      1: '#7dd3fc', 2: '#6ee7b7', 3: '#fca5a5', 4: '#c4b5fd',
      5: '#fdba74', 6: '#67e8f9', 7: '#f0f9ff', 8: '#bae6fd',
    },
    ui: {
      bg: '#062032', bg2: '#0a3b54', panel: '#0c3346', panelBorder: '#1a5577',
      text: '#e3f3fd', muted: '#8fc4dd', accent: '#fde047', accentText: '#063049',
    },
  },
  {
    id: 'sunset',
    name: '석양',
    tier: 1,
    bg: '#2b1a2e',
    hidden: '#7c4a52',
    hiddenBorder: '#9c5e63',
    revealed: '#3a2436',
    revealedBorder: '#5a3a4a',
    flag: '#ffd166',
    flagPole: '#fff0e0',
    flagShape: 'triangle',
    mine: '#2b1a2e',
    mineHitBg: '#c2410c',
    numberColors: {
      1: '#fca5a5', 2: '#fcd34d', 3: '#fb923c', 4: '#f9a8d4',
      5: '#fde68a', 6: '#fed7aa', 7: '#fff7ed', 8: '#e7c6a0',
    },
    ui: {
      bg: '#241526', bg2: '#3a1f33', panel: '#2e1b2b', panelBorder: '#4a2f44',
      text: '#fbe7e0', muted: '#c79bb0', accent: '#fb923c', accentText: '#2b1205',
    },
  },
  {
    id: 'mono',
    name: '모노',
    tier: 1,
    bg: '#111111',
    hidden: '#3a3a3a',
    hiddenBorder: '#525252',
    revealed: '#1c1c1c',
    revealedBorder: '#333333',
    flag: '#ffffff',
    flagPole: '#888888',
    flagShape: 'banner',
    mine: '#111111',
    mineHitBg: '#555555',
    numberColors: {
      1: '#d4d4d4', 2: '#a3a3a3', 3: '#e5e5e5', 4: '#737373',
      5: '#fafafa', 6: '#bdbdbd', 7: '#ffffff', 8: '#8a8a8a',
    },
    ui: {
      bg: '#0d0d0d', bg2: '#1f1f1f', panel: '#171717', panelBorder: '#333333',
      text: '#f5f5f5', muted: '#9a9a9a', accent: '#e5e5e5', accentText: '#111111',
    },
  },
  {
    id: 'grape',
    name: '포도',
    tier: 1,
    bg: '#1e1233',
    hidden: '#4c2d7a',
    hiddenBorder: '#6b3fa0',
    revealed: '#2a1a45',
    revealedBorder: '#3f2a63',
    flag: '#f0abfc',
    flagPole: '#ede9fe',
    flagShape: 'pennant',
    mine: '#1e1233',
    mineHitBg: '#7e22ce',
    numberColors: {
      1: '#a5b4fc', 2: '#86efac', 3: '#fca5a5', 4: '#d8b4fe',
      5: '#fcd34d', 6: '#67e8f9', 7: '#f5d0fe', 8: '#c4b5fd',
    },
    ui: {
      bg: '#160d29', bg2: '#2a1650', panel: '#1f1338', panelBorder: '#3a2560',
      text: '#ece4ff', muted: '#a78bca', accent: '#c084fc', accentText: '#1a0b2e',
    },
  },
];

export const defaultTheme = PRESETS[0];

export function getTheme(id: string): Theme {
  return PRESETS.find((t) => t.id === id) ?? defaultTheme;
}

/** Coin price to unlock a preset theme. Tier 0 themes are free. */
export function themePrice(theme: Theme): number {
  return theme.tier === 0 ? 0 : 300;
}

/** Coin cost to create a custom theme (drawing/image/color editor). */
export const CUSTOM_THEME_COST = 1000;

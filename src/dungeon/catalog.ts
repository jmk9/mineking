import type { DungeonDef, HpRegenTier, SizeTier } from './types';

/**
 * Board sizes per tier — match the original Minesweeper standards
 * (초급 9×9/10, 중급 16×16/40, 고급 16×30/99). Boards 1-4 use the base
 * profile; board 5 is the boss with extra mines (and a slightly bigger
 * grid on 초급 where the base is tiny).
 */
const SIZE_PROFILE: Record<SizeTier, {
  rows: number; cols: number; mines: number;
  bossRows: number; bossCols: number; bossMines: number;
}> = {
  small:  { rows: 9,  cols: 9,  mines: 10, bossRows: 11, bossCols: 11, bossMines: 18 },
  medium: { rows: 16, cols: 16, mines: 40, bossRows: 16, bossCols: 16, bossMines: 52 },
  large:  { rows: 16, cols: 30, mines: 99, bossRows: 16, bossCols: 30, bossMines: 120 },
};

/**
 * HP economy per tier. `easy` heals fully between boards, `medium` partial,
 * `hard` no regen at all.
 */
const HP_PROFILE: Record<HpRegenTier, { startHp: number; minePenalty: number; hpRegenPerBoard: number }> = {
  easy:   { startHp: 100, minePenalty: 25, hpRegenPerBoard: 30 },
  medium: { startHp: 100, minePenalty: 25, hpRegenPerBoard: 15 },
  hard:   { startHp: 100, minePenalty: 25, hpRegenPerBoard: 0 },
};

/**
 * Names + image + subtitles per (size, hpRegen) combo.
 *
 * Theming convention: friendly scenes for 초급 boards (small) -> mysterious
 * scenes for 중급 boards (medium) -> dangerous scenes for 고급 boards (large).
 * The `image` field is the basename of the PNG in public/dungeons/.
 */
interface Entry {
  size: SizeTier;
  hp: HpRegenTier;
  id: string;
  image: string;
  name: string;
  subtitle: string;
}

const ENTRIES: Entry[] = [
  // size-small (초급 보드) — friendly scenes
  { size: 'small',  hp: 'easy',   id: 'small-easy',    image: 'meadow', name: '햇살 들판',    subtitle: '초급 보드 · 풀 회복 · 입문' },
  { size: 'small',  hp: 'medium', id: 'small-medium',  image: 'garden', name: '봄꽃 정원',    subtitle: '초급 보드 · 부분 회복' },
  { size: 'small',  hp: 'hard',   id: 'small-hard',    image: 'beach',  name: '황금 해변',    subtitle: '초급 보드 · 회복 없음' },
  // size-medium (중급 보드) — mysterious scenes
  { size: 'medium', hp: 'easy',   id: 'medium-easy',   image: 'forest', name: '안개 숲',      subtitle: '중급 보드 · 풀 회복' },
  { size: 'medium', hp: 'medium', id: 'medium-medium', image: 'ruins',  name: '잊혀진 유적',  subtitle: '중급 보드 · 부분 회복' },
  { size: 'medium', hp: 'hard',   id: 'medium-hard',   image: 'marsh',  name: '노을 늪',      subtitle: '중급 보드 · 회복 없음' },
  // size-large (고급 보드) — dangerous scenes
  { size: 'large',  hp: 'easy',   id: 'large-easy',    image: 'cavern', name: '용암 동굴',    subtitle: '고급 보드 · 풀 회복' },
  { size: 'large',  hp: 'medium', id: 'large-medium',  image: 'glacier',name: '빙하 협곡',    subtitle: '고급 보드 · 부분 회복' },
  { size: 'large',  hp: 'hard',   id: 'large-hard',    image: 'cosmos', name: '별 너머 심연', subtitle: '고급 보드 · 회복 없음 · 최종' },
];

/** Reward multipliers per difficulty rank 1..9 (matches the order above). */
const REWARD_MULTS = [1.0, 1.2, 1.4, 1.6, 1.9, 2.3, 2.7, 3.2, 3.8];

export const DUNGEONS: DungeonDef[] = ENTRIES.map((e, i) => {
  const sp = SIZE_PROFILE[e.size];
  const hp = HP_PROFILE[e.hp];
  return {
    id: e.id,
    rank: i + 1,
    sizeTier: e.size,
    hpRegenTier: e.hp,
    name: e.name,
    subtitle: e.subtitle,
    imageUrl: `/dungeons/${e.image}.png`,
    ...sp,
    ...hp,
    rewardMult: REWARD_MULTS[i],
  };
});

export function getDungeon(id: string): DungeonDef | undefined {
  return DUNGEONS.find((d) => d.id === id);
}

/** Total number of boards in a single run (boards 1-4 + boss). */
export const RUN_BOARD_COUNT = 5;
/** Index (0-based) of the boss board within a run. */
export const BOSS_BOARD_INDEX = RUN_BOARD_COUNT - 1;

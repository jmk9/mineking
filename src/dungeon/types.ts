/**
 * Adventure mode (사냥터) types.
 *
 * A dungeon is a short linear run of 5 minesweeper boards that share an
 * HP pool. Boards 1-4 are normal, board 5 is the boss (larger / more
 * mines). Difficulty is ordered along two axes:
 *
 *   sizeTier (primary)   : small  < medium < large
 *   hpRegenTier (second.) : easy   < medium < hard  (= more / less / no regen)
 *
 * The two combine into nine ranked dungeons (1 = easiest, 9 = hardest).
 */

export type SizeTier = 'small' | 'medium' | 'large';
export type HpRegenTier = 'easy' | 'medium' | 'hard';

export interface DungeonDef {
  /** Stable string id (also the image basename). */
  id: string;
  /** Difficulty rank from 1 (easiest) to 9 (hardest). */
  rank: number;
  sizeTier: SizeTier;
  hpRegenTier: HpRegenTier;
  /** User-facing name (Korean). */
  name: string;
  /** One-line subtitle for the selection card. */
  subtitle: string;
  /** Public path of the cover image (served from `public/dungeons/`). */
  imageUrl: string;

  // Board template (boards 1-4)
  rows: number;
  cols: number;
  mines: number;

  // Boss board (board 5)
  bossRows: number;
  bossCols: number;
  bossMines: number;

  // HP economy
  startHp: number;
  /** HP cost per mine hit. */
  minePenalty: number;
  /** HP restored when a (non-boss) board is cleared. */
  hpRegenPerBoard: number;

  /** Reward multiplier applied to base coins/XP for this dungeon. */
  rewardMult: number;
}

/** Active run currently in progress. Persisted to localStorage + cloud. */
export interface AdventureRun {
  dungeonId: string;
  /** 0-based index of the current board (0..4). */
  boardIndex: number;
  hp: number;
  maxHp: number;
  /** Number of boards finished so far (0..5). */
  boardsCleared: number;
  /** Coins accrued so far (paid out even on death). */
  pendingCoins: number;
  /** XP accrued so far. */
  pendingXp: number;
  /** When the run started (ms epoch). */
  startedAt: number;
}

export type RunOutcome = 'in-progress' | 'won' | 'lost';

export interface BoardResult {
  cleared: boolean;
  /** Time taken on this board (ms), for stats. */
  timeMs: number;
  flagsUsed: number;
}

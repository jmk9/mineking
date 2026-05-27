import type { DifficultyName } from '../game/types';

/** Lifetime aggregate stats. */
export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
  bestStreak: number;
  noFlagWins: number;
  fastWins: number;
  expertWins: number;
  cellsRevealed: number;
  totalCoins: number;
  bestTimeMs: Partial<Record<DifficultyName, number>>;
}

export interface DailyQuestState {
  date: string; // YYYY-MM-DD this set belongs to
  questIds: string[]; // the 3 quests chosen for today
  progress: Record<string, number>; // questId -> progress
  claimed: string[]; // questIds already rewarded
}

/** The whole persisted player profile. */
export interface PlayerProgress {
  xp: number;
  stats: PlayerStats;
  achievements: Record<string, number>; // achievementId -> tiers already claimed
  perksEquipped: string[];
  daily: DailyQuestState;
  /** Optional display name; falls back to login username when empty. */
  displayName?: string;
}

/** Outcome of one finished game, fed into the progression engine. */
export interface GameResult {
  won: boolean;
  difficulty: DifficultyName;
  timeMs: number;
  flagsUsed: number;
  cellsRevealed: number;
  baseCoins: number; // from the board scoring (computeScore total)
}

export function emptyStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winStreak: 0,
    bestStreak: 0,
    noFlagWins: 0,
    fastWins: 0,
    expertWins: 0,
    cellsRevealed: 0,
    totalCoins: 0,
    bestTimeMs: {},
  };
}

import type { PlayerStats } from './types';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  desc: string;
  goals: number[]; // ascending thresholds; tiered achievements have many
  value: (s: PlayerStats) => number; // current progress value
}

/** Reward for reaching a given tier (0-based) of any achievement. */
export function tierReward(tierIndex: number): { coins: number; xp: number } {
  return { coins: 25 * (tierIndex + 1), xp: 20 * (tierIndex + 1) };
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-win',
    name: '첫 승리',
    icon: '🎉',
    desc: '처음으로 게임을 클리어',
    goals: [1],
    value: (s) => s.wins,
  },
  {
    id: 'wins',
    name: '베테랑',
    icon: '🏆',
    desc: '누적 승리',
    goals: [10, 50, 100, 500, 1000, 5000],
    value: (s) => s.wins,
  },
  {
    id: 'streak',
    name: '연승 행진',
    icon: '🔥',
    desc: '연속 승리',
    goals: [3, 5, 10, 20, 50],
    value: (s) => s.bestStreak,
  },
  {
    id: 'no-flag',
    name: '무결의 손',
    icon: '🚩',
    desc: '깃발 없이 클리어',
    goals: [1, 10, 50, 200, 1000],
    value: (s) => s.noFlagWins,
  },
  {
    id: 'speed',
    name: '스피드러너',
    icon: '⚡',
    desc: '빠른 클리어',
    goals: [5, 25, 100, 500],
    value: (s) => s.fastWins,
  },
  {
    id: 'expert',
    name: '지뢰 마스터',
    icon: '💀',
    desc: '고급 난이도 클리어',
    goals: [1, 10, 50, 200],
    value: (s) => s.expertWins,
  },
  {
    id: 'coins',
    name: '수집가',
    icon: '🪙',
    desc: '누적 코인 획득',
    goals: [100, 1000, 10000, 100000],
    value: (s) => s.totalCoins,
  },
  {
    id: 'pioneer',
    name: '개척자',
    icon: '⛏️',
    desc: '누적 칸 개척',
    goals: [500, 5000, 50000, 500000],
    value: (s) => s.cellsRevealed,
  },
];

/** Number of tiers met for the given progress value. */
export function tiersMet(goals: number[], value: number): number {
  let n = 0;
  for (const g of goals) if (value >= g) n++;
  return n;
}

/** Has the given achievement satisfied the requirement for `level`? */
export function isAchievementDoneAtLevel(
  a: Achievement,
  claimedTiers: number,
  level: number,
): boolean {
  // Achievements with fewer tiers than the level are auto-complete (capped at MAX).
  return claimedTiers >= Math.min(level, a.goals.length);
}

/**
 * Current achievement level the player is working on. Starts at 1.
 * Advances by one only when every achievement has reached the level's
 * tier (capped at each achievement's own MAX).
 */
export function currentAchievementLevel(claimed: Record<string, number>): number {
  let level = 1;
  const MAX_LEVEL = 50; // safety bound
  while (level <= MAX_LEVEL) {
    const allDone = ACHIEVEMENTS.every((a) =>
      isAchievementDoneAtLevel(a, claimed[a.id] ?? 0, level),
    );
    if (!allDone) return level;
    level++;
  }
  return level;
}

/** The threshold this achievement uses at the given level (capped at MAX tier). */
export function achievementGoalAtLevel(a: Achievement, level: number): number {
  return a.goals[Math.min(level, a.goals.length) - 1];
}


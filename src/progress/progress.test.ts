import { describe, expect, it } from 'vitest';
import { xpForLevel, levelInfo, perkSlots } from './level';
import { applyGameResult, defaultProgress } from './engine';
import { tiersMet } from './achievements';
import type { GameResult } from './types';

const win: GameResult = {
  won: true,
  difficulty: 'beginner',
  timeMs: 20_000,
  flagsUsed: 0,
  cellsRevealed: 71,
  baseCoins: 0,
};
const lines = [
  { key: 'clear', label: '클리어', coins: 10 },
  { key: 'speed', label: '속도', coins: 6 },
  { key: 'noflag', label: '노플래그', coins: 3 },
];

describe('level curve', () => {
  it('requires more xp at higher levels', () => {
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1));
    expect(xpForLevel(10)).toBeGreaterThan(xpForLevel(5));
  });

  it('levelInfo accumulates correctly', () => {
    const need1 = xpForLevel(1);
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(need1).level).toBe(2);
    expect(levelInfo(need1 - 1).level).toBe(1);
    expect(levelInfo(need1).intoLevel).toBe(0);
  });

  it('unlocks perk slots with level, capped at 3', () => {
    expect(perkSlots(1)).toBe(1);
    expect(perkSlots(5)).toBe(2);
    expect(perkSlots(9)).toBe(3);
    expect(perkSlots(100)).toBe(3);
  });
});

describe('tiersMet', () => {
  it('counts thresholds reached', () => {
    expect(tiersMet([10, 50, 100], 0)).toBe(0);
    expect(tiersMet([10, 50, 100], 10)).toBe(1);
    expect(tiersMet([10, 50, 100], 60)).toBe(2);
    expect(tiersMet([10, 50, 100], 999)).toBe(3);
  });
});

describe('applyGameResult', () => {
  it('awards coins and xp and updates stats on a win', () => {
    const { progress, deltas } = applyGameResult(defaultProgress(), win, lines);
    expect(deltas.coins).toBeGreaterThanOrEqual(19); // 10+6+3 board + first-win/quest bonuses
    expect(deltas.xp).toBeGreaterThan(0);
    expect(progress.stats.wins).toBe(1);
    expect(progress.stats.noFlagWins).toBe(1);
    expect(progress.stats.winStreak).toBe(1);
  });

  it('unlocks the first-win achievement once', () => {
    const first = applyGameResult(defaultProgress(), win, lines);
    expect(first.deltas.unlockedAchievements.some((a) => a.id === 'first-win')).toBe(true);
    const second = applyGameResult(first.progress, win, lines);
    expect(second.deltas.unlockedAchievements.some((a) => a.id === 'first-win')).toBe(false);
  });

  it('resets streak on a loss but still counts the game', () => {
    const w = applyGameResult(defaultProgress(), win, lines);
    const loss: GameResult = { ...win, won: false, flagsUsed: 2 };
    const { progress } = applyGameResult(w.progress, loss, []);
    expect(progress.stats.winStreak).toBe(0);
    expect(progress.stats.losses).toBe(1);
    expect(progress.stats.gamesPlayed).toBe(2);
  });
});

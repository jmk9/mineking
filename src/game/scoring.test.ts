import { describe, expect, it } from 'vitest';
import { createGame } from './board';
import { computeScore } from './scoring';
import type { GameState } from './types';

/** A won game with overridable stats for scoring tests. */
function wonGame(over: Partial<GameState> = {}): GameState {
  return {
    ...createGame({ rows: 9, cols: 9, mines: 10 }),
    status: 'won',
    minesPlaced: true,
    startTime: 0,
    endTime: 30_000, // 30s
    clicks: 20,
    flagsUsed: 3,
    ...over,
  };
}

describe('scoring', () => {
  it('awards nothing for a non-won game', () => {
    expect(computeScore(wonGame({ status: 'lost' })).total).toBe(0);
    expect(computeScore(wonGame({ status: 'playing' })).total).toBe(0);
  });

  it('always includes a base clear reward equal to mine count', () => {
    const score = computeScore(wonGame({ endTime: 10_000_000, clicks: 9999, flagsUsed: 5 }));
    const clear = score.lines.find((l) => l.key === 'clear');
    expect(clear?.coins).toBe(10);
  });

  it('gives a bigger speed bonus when faster', () => {
    const fast = computeScore(wonGame({ endTime: 5_000 }));
    const slow = computeScore(wonGame({ endTime: 35_000 }));
    const fastSpeed = fast.lines.find((l) => l.key === 'speed')?.coins ?? 0;
    const slowSpeed = slow.lines.find((l) => l.key === 'speed')?.coins ?? 0;
    expect(fastSpeed).toBeGreaterThan(slowSpeed);
  });

  it('rewards a no-flag clear and omits it otherwise', () => {
    const noFlag = computeScore(wonGame({ flagsUsed: 0 }));
    expect(noFlag.lines.some((l) => l.key === 'noflag')).toBe(true);
    const withFlags = computeScore(wonGame({ flagsUsed: 4 }));
    expect(withFlags.lines.some((l) => l.key === 'noflag')).toBe(false);
  });

  it('total equals the sum of its lines', () => {
    const score = computeScore(wonGame({ endTime: 8_000, clicks: 15, flagsUsed: 0 }));
    const sum = score.lines.reduce((a, l) => a + l.coins, 0);
    expect(score.total).toBe(sum);
    expect(score.total).toBeGreaterThan(10); // base + bonuses
  });
});

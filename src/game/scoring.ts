import type { GameState } from './types';

export interface ScoreLine {
  key: string;
  label: string;
  coins: number;
}

export interface ScoreBreakdown {
  lines: ScoreLine[];
  total: number;
}

/**
 * Tunable scoring constants. Kept in one place so balancing is easy later.
 * `base` reward = mine count (scales naturally: beginner 10, intermediate 40, expert 99).
 */
const SCORING = {
  speedParSecondsPerCell: 0.5, // beat this pace for a full speed bonus
  speedMaxFactor: 1.0, // speed bonus caps at base * this
  efficiencyParClickFactor: 0.4, // par clicks = nonMineCells * this
  efficiencyMaxFactor: 0.5, // efficiency bonus caps at base * this
  noFlagFactor: 0.3, // no-flag clear bonus = base * this
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Coins earned for a finished game. Only a win earns coins; a loss returns 0.
 * Breakdown lines are transparent so the result screen can show each bonus.
 */
export function computeScore(state: GameState): ScoreBreakdown {
  if (state.status !== 'won') return { lines: [], total: 0 };

  const cells = state.rows * state.cols;
  const nonMine = cells - state.mines;
  const base = state.mines;
  const timeSec =
    state.startTime != null && state.endTime != null
      ? (state.endTime - state.startTime) / 1000
      : 0;

  const lines: ScoreLine[] = [{ key: 'clear', label: '클리어', coins: base }];

  // Speed: beating the par pace pays up to base * speedMaxFactor.
  const parSeconds = cells * SCORING.speedParSecondsPerCell;
  const speed = clamp(
    Math.round(base * SCORING.speedMaxFactor * ((parSeconds - timeSec) / parSeconds)),
    0,
    Math.round(base * SCORING.speedMaxFactor),
  );
  if (speed > 0) {
    lines.push({ key: 'speed', label: `속도 보너스 (${Math.round(timeSec)}초)`, coins: speed });
  }

  // Efficiency: fewer clicks than par pays up to base * efficiencyMaxFactor.
  const parClicks = nonMine * SCORING.efficiencyParClickFactor;
  const efficiency = clamp(
    Math.round(base * SCORING.efficiencyMaxFactor * ((parClicks - state.clicks) / parClicks)),
    0,
    Math.round(base * SCORING.efficiencyMaxFactor),
  );
  if (efficiency > 0) {
    lines.push({ key: 'efficiency', label: `효율 보너스 (${state.clicks}클릭)`, coins: efficiency });
  }

  // No-flag clear.
  if (state.flagsUsed === 0) {
    lines.push({ key: 'noflag', label: '노-플래그 클리어', coins: Math.round(base * SCORING.noFlagFactor) });
  }

  const total = lines.reduce((sum, l) => sum + l.coins, 0);
  return { lines, total };
}

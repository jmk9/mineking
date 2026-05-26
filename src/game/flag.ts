import { cloneGrid } from './board';
import type { GameState } from './types';

/** Toggle a flag on a hidden/flagged cell. No effect on revealed cells or finished games. */
export function toggleFlag(state: GameState, r: number, c: number): GameState {
  if (state.status === 'won' || state.status === 'lost') return state;

  const cell = state.grid[r][c];
  if (cell.state === 'revealed') return state;

  const grid = cloneGrid(state.grid);
  const target = grid[r][c];
  let flagsUsed = state.flagsUsed;

  if (target.state === 'flagged') {
    target.state = 'hidden';
  } else {
    target.state = 'flagged';
    flagsUsed += 1; // cumulative count, used for the "no-flag clear" reward (M2)
  }

  return { ...state, grid, flagsUsed };
}

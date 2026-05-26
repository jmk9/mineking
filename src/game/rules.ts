import type { GameState, Grid } from './types';

/** A win = every non-mine cell is revealed. */
export function isWon(grid: Grid): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.isMine && cell.state !== 'revealed') return false;
    }
  }
  return true;
}

/** On loss, reveal all mines so the player sees the board. */
export function revealAllMines(grid: Grid): void {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isMine) cell.state = 'revealed';
    }
  }
}

export function isOver(state: GameState): boolean {
  return state.status === 'won' || state.status === 'lost';
}

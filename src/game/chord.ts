import { cloneGrid, forEachNeighbor } from './board';
import { floodReveal } from './reveal';
import { isWon, revealAllMines } from './rules';
import type { GameState, Grid } from './types';

function countFlaggedNeighbors(grid: Grid, state: GameState, r: number, c: number): number {
  let count = 0;
  forEachNeighbor(state, r, c, (nr, nc) => {
    if (grid[nr][nc].state === 'flagged') count++;
  });
  return count;
}

/**
 * Chording: tap a revealed number cell. If the count of flagged neighbors equals
 * the cell's number, reveal all remaining hidden neighbors at once. If a flag was
 * placed wrongly, this reveals a mine and the game is lost.
 * No effect unless the cell is revealed with adjacent > 0 and flags match.
 */
export function chord(state: GameState, r: number, c: number, now: number = Date.now()): GameState {
  if (state.status !== 'playing') return state;

  const cell = state.grid[r][c];
  if (cell.state !== 'revealed' || cell.adjacent === 0) return state;
  if (countFlaggedNeighbors(state.grid, state, r, c) !== cell.adjacent) return state;

  const grid = cloneGrid(state.grid);
  let hitMine = false;

  forEachNeighbor(state, r, c, (nr, nc) => {
    const n = grid[nr][nc];
    if (n.state !== 'hidden') return;
    if (n.isMine) {
      n.state = 'revealed';
      hitMine = true;
    } else {
      floodReveal(grid, state, nr, nc);
    }
  });

  if (hitMine) {
    revealAllMines(grid);
    return {
      ...state,
      grid,
      status: 'lost',
      endTime: now,
      clicks: state.clicks + 1,
      mistakes: state.mistakes + 1,
    };
  }

  const won = isWon(grid);
  return {
    ...state,
    grid,
    status: won ? 'won' : 'playing',
    endTime: won ? now : null,
    clicks: state.clicks + 1,
  };
}

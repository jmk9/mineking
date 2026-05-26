import { cloneGrid, forEachNeighbor, placeMines } from './board';
import { isWon, revealAllMines } from './rules';
import type { GameState, Grid } from './types';

/** Flood-fill reveal starting at (r, c). Mutates `grid`. Assumes the cell is not a mine. */
export function floodReveal(grid: Grid, state: { rows: number; cols: number }, r: number, c: number): void {
  const stack: Array<[number, number]> = [[r, c]];
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!;
    const cell = grid[cr][cc];
    if (cell.state === 'revealed') continue;
    if (cell.state === 'flagged') continue;
    cell.state = 'revealed';
    // Only keep expanding from cells with no adjacent mines.
    if (cell.adjacent === 0) {
      forEachNeighbor(state, cr, cc, (nr, nc) => {
        if (grid[nr][nc].state === 'hidden') stack.push([nr, nc]);
      });
    }
  }
}

/**
 * Reveal the cell at (r, c). Handles first-click mine placement, flood fill,
 * loss on mine, and win detection. Returns a new GameState (input untouched).
 */
export function reveal(state: GameState, r: number, c: number, now: number = Date.now()): GameState {
  if (state.status === 'won' || state.status === 'lost') return state;

  const cell = state.grid[r][c];
  if (cell.state === 'revealed' || cell.state === 'flagged') return state;

  const grid = cloneGrid(state.grid);
  let { minesPlaced, startTime } = state;

  // First reveal: place mines (safe around this cell) and start the clock.
  if (!minesPlaced) {
    placeMines(grid, state, r, c);
    minesPlaced = true;
    startTime = now;
  }

  const target = grid[r][c];

  if (target.isMine) {
    target.state = 'revealed';
    revealAllMines(grid);
    return {
      ...state,
      grid,
      minesPlaced,
      startTime,
      status: 'lost',
      endTime: now,
      clicks: state.clicks + 1,
      mistakes: state.mistakes + 1,
    };
  }

  floodReveal(grid, state, r, c);

  const won = isWon(grid);
  return {
    ...state,
    grid,
    minesPlaced,
    startTime,
    status: won ? 'won' : 'playing',
    endTime: won ? now : null,
    clicks: state.clicks + 1,
  };
}

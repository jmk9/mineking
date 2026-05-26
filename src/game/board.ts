import type { Cell, GameConfig, GameState, Grid } from './types';

/** All 8 neighbor offsets. */
export const NEIGHBORS: ReadonlyArray<[number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

export function inBounds(state: { rows: number; cols: number }, r: number, c: number): boolean {
  return r >= 0 && r < state.rows && c >= 0 && c < state.cols;
}

export function forEachNeighbor(
  state: { rows: number; cols: number },
  r: number,
  c: number,
  fn: (nr: number, nc: number) => void,
): void {
  for (const [dr, dc] of NEIGHBORS) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(state, nr, nc)) fn(nr, nc);
  }
}

function makeEmptyGrid(rows: number, cols: number): Grid {
  const grid: Grid = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ isMine: false, adjacent: 0, state: 'hidden' });
    }
    grid.push(row);
  }
  return grid;
}

/** A fresh game with an empty board. Mines are placed on the first reveal. */
export function createGame(config: GameConfig): GameState {
  const { rows, cols, mines } = config;
  return {
    rows,
    cols,
    mines,
    grid: makeEmptyGrid(rows, cols),
    status: 'ready',
    minesPlaced: false,
    flagsUsed: 0,
    startTime: null,
    endTime: null,
    clicks: 0,
    mistakes: 0,
  };
}

/**
 * Place mines randomly, guaranteeing the first-clicked cell and its neighbors
 * are mine-free (so the first reveal always opens an area). Falls back to only
 * protecting the clicked cell if the board is too dense to also spare neighbors.
 */
export function placeMines(
  grid: Grid,
  state: { rows: number; cols: number; mines: number },
  safeR: number,
  safeC: number,
  rng: () => number = Math.random,
): void {
  const { rows, cols, mines } = state;
  const total = rows * cols;

  const forbidden = new Set<number>();
  forbidden.add(safeR * cols + safeC);
  forEachNeighbor(state, safeR, safeC, (nr, nc) => forbidden.add(nr * cols + nc));

  // If sparing neighbors leaves too few cells for the mines, only spare the click.
  if (total - forbidden.size < mines) {
    forbidden.clear();
    forbidden.add(safeR * cols + safeC);
  }

  const candidates: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!forbidden.has(i)) candidates.push(i);
  }

  // Fisher-Yates partial shuffle to pick `mines` cells.
  for (let i = 0; i < mines; i++) {
    const j = i + Math.floor(rng() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    const idx = candidates[i];
    grid[Math.floor(idx / cols)][idx % cols].isMine = true;
  }

  computeAdjacency(grid, state);
}

/** Recompute every cell's adjacent-mine count. */
export function computeAdjacency(grid: Grid, state: { rows: number; cols: number }): void {
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (grid[r][c].isMine) {
        grid[r][c].adjacent = 0;
        continue;
      }
      let count = 0;
      forEachNeighbor(state, r, c, (nr, nc) => {
        if (grid[nr][nc].isMine) count++;
      });
      grid[r][c].adjacent = count;
    }
  }
}

/** Deep-clone a grid so callers can return a new state without mutating the old. */
export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

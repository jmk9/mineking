import { describe, expect, it } from 'vitest';
import { computeAdjacency, createGame, placeMines } from './board';
import { reveal } from './reveal';
import { toggleFlag } from './flag';
import { chord } from './chord';
import type { GameState } from './types';

/**
 * Build a deterministic, already-started game from an ASCII map.
 * '*' = mine, '.' = empty. Mines are placed and adjacency computed.
 */
function gameFromMap(map: string[]): GameState {
  const rows = map.length;
  const cols = map[0].length;
  const state = createGame({ rows, cols, mines: 0 });
  let mines = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (map[r][c] === '*') {
        state.grid[r][c].isMine = true;
        mines++;
      }
    }
  }
  computeAdjacency(state.grid, state);
  return { ...state, mines, minesPlaced: true, status: 'playing' };
}

describe('board / first-click safety', () => {
  it('creates an empty ready board', () => {
    const g = createGame({ rows: 9, cols: 9, mines: 10 });
    expect(g.status).toBe('ready');
    expect(g.grid.length).toBe(9);
    expect(g.grid[0].length).toBe(9);
    expect(g.grid.flat().every((c) => c.state === 'hidden' && !c.isMine)).toBe(true);
  });

  it('never places a mine on the first-clicked cell or its neighbors', () => {
    for (let trial = 0; trial < 50; trial++) {
      const g = createGame({ rows: 9, cols: 9, mines: 10 });
      const grid = g.grid.map((row) => row.map((c) => ({ ...c })));
      placeMines(grid, g, 4, 4);
      // clicked cell and all 8 neighbors must be mine-free
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          expect(grid[4 + dr][4 + dc].isMine).toBe(false);
        }
      }
      const mineCount = grid.flat().filter((c) => c.isMine).length;
      expect(mineCount).toBe(10);
    }
  });

  it('first reveal places mines and starts the game', () => {
    const g = createGame({ rows: 9, cols: 9, mines: 10 });
    const after = reveal(g, 4, 4, 1000);
    expect(after.minesPlaced).toBe(true);
    expect(after.startTime).toBe(1000);
    expect(after.status === 'playing' || after.status === 'won').toBe(true);
    expect(after.grid[4][4].state).toBe('revealed');
  });
});

describe('reveal / flood fill', () => {
  it('flood-reveals a connected empty region and its number border', () => {
    // mine in the corner; revealing the opposite area opens many cells
    const g = gameFromMap([
      '*....',
      '.....',
      '.....',
      '.....',
      '.....',
    ]);
    const after = reveal(g, 4, 4, 1000);
    // the only mine stays hidden; everything else opens
    const hidden = after.grid.flat().filter((c) => c.state === 'hidden');
    expect(hidden.length).toBe(1);
    expect(hidden[0].isMine).toBe(true);
    expect(after.status).toBe('won');
  });

  it('does not flood past number cells', () => {
    const g = gameFromMap([
      '*..',
      '...',
      '...',
    ]);
    // (0,1) is a "1" next to the mine; revealing it opens only that cell
    const after = reveal(g, 0, 1, 1000);
    expect(after.grid[0][1].state).toBe('revealed');
    expect(after.grid[0][1].adjacent).toBe(1);
    expect(after.grid[2][2].state).toBe('hidden'); // far cell not opened
  });

  it('revealing a mine loses the game and exposes all mines', () => {
    const g = gameFromMap([
      '*.*',
      '...',
      '*..',
    ]);
    const after = reveal(g, 0, 0, 1000);
    expect(after.status).toBe('lost');
    expect(after.mistakes).toBe(1);
    const minesRevealed = after.grid.flat().filter((c) => c.isMine && c.state === 'revealed');
    expect(minesRevealed.length).toBe(3);
  });

  it('ignores reveal on flagged or already-revealed cells', () => {
    const g = gameFromMap(['*..', '...', '...']);
    const flagged = toggleFlag(g, 0, 0);
    const after = reveal(flagged, 0, 0, 1000);
    expect(after.grid[0][0].state).toBe('flagged');
    expect(after.status).toBe('playing');
  });
});

describe('flags', () => {
  it('toggles a flag on and off and tracks cumulative usage', () => {
    const g = gameFromMap(['*..', '...', '...']);
    const on = toggleFlag(g, 0, 0);
    expect(on.grid[0][0].state).toBe('flagged');
    expect(on.flagsUsed).toBe(1);
    const off = toggleFlag(on, 0, 0);
    expect(off.grid[0][0].state).toBe('hidden');
    expect(off.flagsUsed).toBe(1); // cumulative: counts placements, not net
  });
});

describe('chording', () => {
  it('reveals neighbors when flag count matches the number', () => {
    const g = gameFromMap([
      '*..',
      '...',
      '...',
    ]);
    // reveal the "1" at (0,1), flag the mine, then chord
    let s = reveal(g, 0, 1, 1000);
    s = toggleFlag(s, 0, 0);
    s = chord(s, 0, 1, 1000);
    // all non-mine cells should now be revealed -> win
    expect(s.status).toBe('won');
  });

  it('does nothing when flag count does not match', () => {
    const g = gameFromMap(['*..', '...', '...']);
    let s = reveal(g, 0, 1, 1000); // reveal the "1"
    const before = s;
    s = chord(s, 0, 1, 1000); // no flags placed yet -> no-op
    expect(s).toBe(before);
  });

  it('loses if a flag was placed on a wrong (non-mine) cell', () => {
    const g = gameFromMap([
      '*..',
      '...',
      '...',
    ]);
    let s = reveal(g, 0, 1, 1000); // "1"
    s = toggleFlag(s, 0, 2); // wrong flag (no mine here)
    s = chord(s, 0, 1, 1000); // flag count (1) matches number (1) -> reveals (1,0)... actually reveals real mine?
    // The wrong flag satisfies the count, so chord reveals the truly-hidden mine at (0,0) -> loss
    expect(s.status).toBe('lost');
  });
});

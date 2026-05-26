export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  isMine: boolean;
  adjacent: number; // number of mines in the 8 neighbors, 0-8
  state: CellState;
}

export type Grid = Cell[][]; // grid[row][col]

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}

export interface GameState {
  rows: number;
  cols: number;
  mines: number;
  grid: Grid;
  status: GameStatus;
  minesPlaced: boolean;
  flagsUsed: number;
  // stats used later for scoring (M2)
  startTime: number | null;
  endTime: number | null;
  clicks: number;
  mistakes: number;
}

export const DIFFICULTIES = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
} as const;

export type DifficultyName = keyof typeof DIFFICULTIES;

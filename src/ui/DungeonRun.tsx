import { useEffect, useMemo, useRef, useState } from 'react';
import { chord, createGame, reveal, toggleFlag } from '../game';
import type { GameState } from '../game/types';
import { BOSS_BOARD_INDEX } from '../dungeon/catalog';
import { applyBoardCleared, applyMineHit, dungeonOf, isBossBoard } from '../dungeon/run';
import type { AdventureRun, RunOutcome } from '../dungeon/types';
import type { Theme } from '../render/theme';
import { BoardCanvas } from './BoardCanvas';
import { useElementWidth } from './useElementWidth';

interface Props {
  run: AdventureRun;
  /** Equipped meta cards for reward calculation. */
  perksEquipped: string[];
  /** Player level (for perk slot resolution). */
  playerLevel: number;
  theme: Theme;
  loupeEnabled: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
  /** Persist the updated run (called on every board boundary). */
  onRunChange: (run: AdventureRun) => void;
  /** Run finished — render the result screen. */
  onRunEnded: (run: AdventureRun, outcome: Exclude<RunOutcome, 'in-progress'>) => void;
  /** Back button: pause/minimize the view (run preserved). */
  onQuit: () => void;
  /** Forfeit the run entirely (treated as a loss with partial reward). */
  onForfeit: () => void;
}

type Mode = 'open' | 'flag';

const MIN_CELL = 30;
const MAX_CELL = 48;

function boardConfigFor(run: AdventureRun) {
  const d = dungeonOf(run);
  if (!d) return { rows: 9, cols: 9, mines: 10 };
  if (isBossBoard(run)) return { rows: d.bossRows, cols: d.bossCols, mines: d.bossMines };
  return { rows: d.rows, cols: d.cols, mines: d.mines };
}

export function DungeonRun({
  run: initialRun,
  perksEquipped,
  playerLevel,
  theme,
  loupeEnabled,
  zoom,
  onZoomChange,
  onRunChange,
  onRunEnded,
  onQuit,
  onForfeit,
}: Props) {
  const [run, setRun] = useState<AdventureRun>(initialRun);
  const [mode, setMode] = useState<Mode>('open');
  const dungeon = dungeonOf(run);

  // Fresh minesweeper game per board.
  const [board, setBoard] = useState<GameState>(() => createGame(boardConfigFor(run)));

  const boardWrapRef = useRef<HTMLDivElement>(null);
  const availWidth = useElementWidth(boardWrapRef);
  const baseCell = useMemo(() => {
    if (availWidth <= 0) return MIN_CELL;
    const fit = availWidth / board.cols;
    return Math.max(MIN_CELL, Math.min(MAX_CELL, fit));
  }, [availWidth, board.cols]);
  const cellSize = baseCell * zoom;

  // When the run advances to a new board, rebuild the game state.
  useEffect(() => {
    setBoard(createGame(boardConfigFor(run)));
    setMode('open');
  }, [run.dungeonId, run.boardIndex]);

  const handleTap = (r: number, c: number, kind: 'auto' | 'reveal' | 'flag' = 'auto') => {
    const cell = board.grid[r][c];
    let next: GameState;
    if (cell.state === 'revealed') {
      next = chord(board, r, c);
    } else if (board.status === 'ready') {
      next = reveal(board, r, c);
    } else if (kind === 'reveal') {
      next = reveal(board, r, c);
    } else if (kind === 'flag') {
      next = toggleFlag(board, r, c);
    } else if (mode === 'flag') {
      next = toggleFlag(board, r, c);
    } else {
      next = reveal(board, r, c);
    }
    if (next === board) return;
    setBoard(next);

    if (next.status === 'lost') {
      // Mine hit -- drain HP. Same board retried unless dead.
      const r = applyMineHit(run);
      setRun(r.run);
      onRunChange(r.run);
      if (r.dead) {
        onRunEnded(r.run, 'lost');
      } else {
        // Regenerate the same board so the player can retry.
        setTimeout(() => setBoard(createGame(boardConfigFor(r.run))), 600);
      }
    } else if (next.status === 'won') {
      const result = applyBoardCleared(run, perksEquipped, playerLevel);
      setRun(result.run);
      onRunChange(result.run);
      if (result.outcome === 'won') {
        onRunEnded(result.run, 'won');
      }
      // Otherwise the useEffect above will recreate the next board.
    }
  };

  if (!dungeon) return null;

  const hpPct = Math.round((run.hp / run.maxHp) * 100);
  const hpColor = hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="dungeon-run">
      <div className="dungeon-run-head">
        <button className="dungeon-quit" onClick={onQuit} aria-label="이어할 수 있게 잠시 닫기">
          ←
        </button>
        <div className="dungeon-run-title">
          <span className="dungeon-run-name">{dungeon.name}</span>
          <span className="dungeon-run-stage">
            보드 {run.boardIndex + 1}/5{run.boardIndex === BOSS_BOARD_INDEX ? ' · 👑 보스' : ''}
          </span>
        </div>
        <div className="dungeon-run-coin">🪙 {run.pendingCoins}</div>
        <button
          className="dungeon-forfeit"
          onClick={() => {
            const msg = `사냥터를 그만두면 지금까지 받은 보상(${run.pendingCoins} 코인 · ${run.pendingXp} XP)만 정산되고 런이 끝나요. 그만둘까요?`;
            if (confirm(msg)) onForfeit();
          }}
        >
          그만하기
        </button>
      </div>

      <div className="hp-bar" aria-label={`HP ${run.hp}/${run.maxHp}`}>
        <div className="hp-bar-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
        <span className="hp-bar-text">
          ❤️ {run.hp} / {run.maxHp}
        </span>
      </div>

      <div className="board-wrap" ref={boardWrapRef} style={{ background: theme.bg }}>
        <BoardCanvas
          state={board}
          cellSize={cellSize}
          theme={theme}
          loupeEnabled={loupeEnabled}
          zoom={zoom}
          onZoomChange={onZoomChange}
          onCellTap={handleTap}
        />
      </div>

      <div className="segmented mode-toggle">
        <button className={mode === 'open' ? 'active' : ''} onClick={() => setMode('open')}>
          ⛏️ 오픈
        </button>
        <button className={mode === 'flag' ? 'active' : ''} onClick={() => setMode('flag')}>
          🚩 깃발
        </button>
      </div>
    </div>
  );
}

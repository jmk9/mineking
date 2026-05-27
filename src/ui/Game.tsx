import { useEffect, useMemo, useRef, useState } from 'react';
import { chord, createGame, reveal, toggleFlag } from '../game';
import { computeScore, type ScoreBreakdown } from '../game/scoring';
import { DIFFICULTIES, type DifficultyName, type GameState } from '../game/types';
import { PRESETS, defaultTheme } from '../render/presets';
import { draftFromTheme, type ThemeDraft } from '../render/customTheme';
import type { Theme } from '../render/theme';
import { loadCoins, saveCoins } from '../storage/wallet';
import { loadThemeId, saveThemeId, loadLoupeEnabled, saveLoupeEnabled } from '../storage/prefs';
import { loadCustomThemes, saveCustomThemes } from '../storage/customThemes';
import { loadUnlocks, saveUnlocks } from '../storage/unlocks';
import { loadProgress, saveProgress } from '../storage/progress';
import { applyGameResult, togglePerk, type ResultDeltas } from '../progress/engine';
import { levelInfo, perkSlots } from '../progress/level';
import type { GameResult, PlayerProgress } from '../progress/types';
import { BoardCanvas } from './BoardCanvas';
import { ResultOverlay } from './ResultOverlay';
import { ThemePicker } from './ThemePicker';
import { ThemeEditor } from './ThemeEditor';
import { ProfilePage } from './ProfilePage';
import { Settings } from './Settings';
import { NameEditor } from './NameEditor';
import { usePWAInstall } from './usePWAInstall';
import { useElementWidth } from './useElementWidth';
import { useElapsedSeconds } from './useTimer';

type Mode = 'open' | 'flag';

const MIN_CELL = 30;
const MAX_CELL = 48;

function countFlags(state: GameState): number {
  let n = 0;
  for (const row of state.grid) for (const cell of row) if (cell.state === 'flagged') n++;
  return n;
}

function countRevealed(state: GameState): number {
  let n = 0;
  for (const row of state.grid) for (const cell of row) if (cell.state === 'revealed' && !cell.isMine) n++;
  return n;
}

/** Pad a count to 3 chars for the LED-style HUD counters. */
function pad3(n: number): string {
  if (n < 0) return `-${Math.min(99, -n)}`.padStart(3, '0');
  return Math.min(999, n).toString().padStart(3, '0');
}

const FACE: Record<GameState['status'], string> = {
  ready: '🙂',
  playing: '🙂',
  won: '😎',
  lost: '😵',
};

const DIFF_LABEL: Record<DifficultyName, string> = {
  beginner: '초급',
  intermediate: '중급',
  expert: '고급',
};

interface GameProps {
  account?: { name: string; onLogout: () => void };
}

export function Game({ account }: GameProps = {}) {
  const [difficulty, setDifficulty] = useState<DifficultyName>('beginner');
  const [state, setState] = useState<GameState>(() => createGame(DIFFICULTIES.beginner));
  const [mode, setMode] = useState<Mode>('open');
  const [coins, setCoins] = useState<number>(() => loadCoins());
  const [reward, setReward] = useState<ScoreBreakdown | null>(null);
  const [deltas, setDeltas] = useState<ResultDeltas | null>(null);
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeId, setThemeId] = useState<string>(() => loadThemeId() ?? 'classic');
  const [customThemes, setCustomThemes] = useState<Theme[]>(() => loadCustomThemes());
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(() => loadUnlocks());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editorDraft, setEditorDraft] = useState<ThemeDraft | null>(null);

  const theme =
    [...PRESETS, ...customThemes].find((t) => t.id === themeId) ?? defaultTheme;

  // Skin the whole app UI from the active theme's palette.
  useEffect(() => {
    const root = document.documentElement.style;
    const u = theme.ui;
    root.setProperty('--bg', u.bg);
    root.setProperty('--bg2', u.bg2);
    root.setProperty('--panel', u.panel);
    root.setProperty('--panel-border', u.panelBorder);
    root.setProperty('--text', u.text);
    root.setProperty('--muted', u.muted);
    root.setProperty('--accent', u.accent);
    root.setProperty('--accent-text', u.accentText);
  }, [theme]);

  const boardWrapRef = useRef<HTMLDivElement>(null);
  const availWidth = useElementWidth(boardWrapRef);
  const elapsed = useElapsedSeconds(state);

  const [zoom, setZoom] = useState(1);
  const [loupeEnabled, setLoupeEnabled] = useState(() => loadLoupeEnabled());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameEditorOpen, setNameEditorOpen] = useState(false);
  const { canInstall, install } = usePWAInstall();
  const baseCell = useMemo(() => {
    if (availWidth <= 0) return MIN_CELL;
    const fit = Math.floor(availWidth / state.cols);
    return Math.max(MIN_CELL, Math.min(MAX_CELL, fit));
  }, [availWidth, state.cols]);
  const cellSize = Math.round(baseCell * zoom);

  const onLoupeToggle = (enabled: boolean) => {
    setLoupeEnabled(enabled);
    saveLoupeEnabled(enabled);
  };

  const renameProfile = (name: string) => {
    const next: PlayerProgress = { ...progress, displayName: name || undefined };
    setProgress(next);
    saveProgress(next);
    setNameEditorOpen(false);
  };

  const minesLeft = state.mines - countFlags(state);

  const newGame = (d: DifficultyName = difficulty) => {
    setDifficulty(d);
    setState(createGame(DIFFICULTIES[d]));
    setReward(null);
    setDeltas(null);
  };

  const selectTheme = (id: string) => {
    setThemeId(id);
    saveThemeId(id);
    setPickerOpen(false);
  };

  const buyTheme = (id: string, price: number) => {
    if (coins < price || unlockedThemes.includes(id)) return;
    const balance = coins - price;
    setCoins(balance);
    saveCoins(balance);
    const next = [...unlockedThemes, id];
    setUnlockedThemes(next);
    saveUnlocks(next);
  };

  const saveTheme = (created: Theme) => {
    const next = [...customThemes, created];
    setCustomThemes(next);
    saveCustomThemes(next);
    setEditorDraft(null);
    selectTheme(created.id); // apply the new theme immediately
  };

  const deleteTheme = (id: string) => {
    const next = customThemes.filter((t) => t.id !== id);
    setCustomThemes(next);
    saveCustomThemes(next);
    if (themeId === id) selectTheme('classic');
  };

  const handleTap = (r: number, c: number) => {
    const cell = state.grid[r][c];
    let next: GameState;
    if (cell.state === 'revealed') {
      next = chord(state, r, c); // chording works in both modes
    } else if (mode === 'flag') {
      next = toggleFlag(state, r, c);
    } else {
      next = reveal(state, r, c);
    }
    if (next === state) return;
    setState(next);

    // On any game end, run the progression engine (coins + xp + achievements + quests).
    if (next.status === 'won' || next.status === 'lost') {
      const score = computeScore(next);
      const result: GameResult = {
        won: next.status === 'won',
        difficulty,
        timeMs: next.startTime != null && next.endTime != null ? next.endTime - next.startTime : 0,
        flagsUsed: next.flagsUsed,
        cellsRevealed: countRevealed(next),
        baseCoins: score.total,
      };
      const { progress: nextProgress, deltas: d } = applyGameResult(progress, result, score.lines);
      setProgress(nextProgress);
      saveProgress(nextProgress);
      const balance = coins + d.coins;
      setCoins(balance);
      saveCoins(balance);
      setReward(score);
      setDeltas(d);
    }
  };

  const onTogglePerk = (id: string) => {
    const level = levelInfo(progress.xp).level;
    const next = { ...progress, perksEquipped: togglePerk(progress.perksEquipped, id, perkSlots(level)) };
    setProgress(next);
    saveProgress(next);
  };

  return (
    <div className="game">
      <header className="appbar">
        <div className="brand">
          <span className="brand-mark">🚩</span>
          <span className="brand-name">지뢰왕</span>
        </div>
        <div className="appbar-right">
          <span className="coin-pill">🪙 {coins}</span>
          <button className="profile-btn" onClick={() => setProfileOpen(true)}>
            👤 Lv {levelInfo(progress.xp).level}
          </button>
          <button className="theme-btn" onClick={() => setPickerOpen(true)}>
            🎨
          </button>
          <button className="theme-btn" onClick={() => setSettingsOpen(true)} aria-label="설정">
            ⚙️
          </button>
        </div>
      </header>

      <div className="segmented difficulty">
        {(Object.keys(DIFFICULTIES) as DifficultyName[]).map((d) => (
          <button
            key={d}
            className={d === difficulty ? 'active' : ''}
            onClick={() => newGame(d)}
          >
            {DIFF_LABEL[d]}
          </button>
        ))}
      </div>

      <section className="board-card">
        <div className="hud">
          <div className="counter" aria-label="남은 지뢰">
            <span className="counter-ico">💣</span>
            <span className="counter-val">{pad3(minesLeft)}</span>
          </div>
          <button
            className={`face-btn ${state.status}`}
            onClick={() => newGame()}
            aria-label="새 게임"
          >
            {FACE[state.status]}
          </button>
          <div className="counter" aria-label="경과 시간">
            <span className="counter-ico">⏱️</span>
            <span className="counter-val">{pad3(elapsed)}</span>
          </div>
        </div>

        <div className="board-wrap" ref={boardWrapRef} style={{ background: theme.bg }}>
          <BoardCanvas
            state={state}
            cellSize={cellSize}
            theme={theme}
            loupeEnabled={loupeEnabled}
            onCellTap={handleTap}
          />
        </div>

        <div className="zoom-fab">
          <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}>－</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}>＋</button>
        </div>
      </section>

      <div className="segmented mode-toggle">
        <button className={mode === 'open' ? 'active' : ''} onClick={() => setMode('open')}>
          ⛏️ 오픈
        </button>
        <button className={mode === 'flag' ? 'active' : ''} onClick={() => setMode('flag')}>
          🚩 깃발
        </button>
      </div>
      <p className="hint">깃발 모드에서 열린 숫자를 누르면 주변을 한 번에 점검(코드)해요.</p>

      {reward && deltas && (state.status === 'won' || state.status === 'lost') && (
        <ResultOverlay
          status={state.status}
          score={reward}
          deltas={deltas}
          balance={coins}
          onNewGame={() => newGame()}
        />
      )}

      {profileOpen && (
        <ProfilePage
          progress={progress}
          coins={coins}
          account={account}
          onTogglePerk={onTogglePerk}
          onOpenRename={account ? () => setNameEditorOpen(true) : undefined}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {nameEditorOpen && account && (
        <NameEditor
          initial={progress.displayName}
          username={account.name}
          onSave={renameProfile}
          onClose={() => setNameEditorOpen(false)}
        />
      )}

      {pickerOpen && (
        <ThemePicker
          activeId={themeId}
          customThemes={customThemes}
          unlockedIds={unlockedThemes}
          coins={coins}
          onSelect={selectTheme}
          onBuy={buyTheme}
          onDelete={deleteTheme}
          onCreate={() => {
            setPickerOpen(false);
            setEditorDraft(draftFromTheme(theme));
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {editorDraft && (
        <ThemeEditor
          initial={editorDraft}
          onSave={saveTheme}
          onCancel={() => setEditorDraft(null)}
        />
      )}

      {settingsOpen && (
        <Settings
          loupeEnabled={loupeEnabled}
          onLoupeToggle={onLoupeToggle}
          account={account}
          canInstall={canInstall}
          onInstall={install}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { chord, createGame, reveal, toggleFlag } from '../game';
import { computeScore, type ScoreBreakdown } from '../game/scoring';
import { DIFFICULTIES, type DifficultyName, type GameState } from '../game/types';
import { CUSTOM_THEME_COST, PRESETS, defaultTheme } from '../render/presets';
import { draftFromTheme, type ThemeDraft } from '../render/customTheme';
import type { Theme } from '../render/theme';
import { loadCoins, saveCoins } from '../storage/wallet';
import {
  loadThemeId,
  saveThemeId,
  loadLoupeEnabled,
  saveLoupeEnabled,
  loadBgmEnabled,
  saveBgmEnabled,
  loadBgmVolume,
  saveBgmVolume,
  loadSfxEnabled,
  saveSfxEnabled,
  loadStartMode,
  saveStartMode,
  type StartMode,
} from '../storage/prefs';
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
import { Dungeons } from './Dungeons';
import { DungeonRun } from './DungeonRun';
import { DungeonResult } from './DungeonResult';
import { Home } from './Home';
import { getDungeon } from '../dungeon/catalog';
import { startRun } from '../dungeon/run';
import type { AdventureRun } from '../dungeon/types';
import { clearDungeonRun, loadDungeonRun, saveDungeonRun } from '../storage/dungeonRun';
import { usePWAInstall } from './usePWAInstall';
import { useBGM } from './useBGM';
import { sfxInit, sfxPlay, sfxSetEnabled, sfxSetVolume } from '../audio/sfx';

/** Background music tracks served from public/audio/. Missing files are silent. */
const BGM_TRACKS = {
  main: '/audio/main.mp3',
  training: '/audio/training.mp3',
  small: '/audio/tier1.mp3',
  medium: '/audio/tier2.mp3',
  large: '/audio/tier3.mp3',
} as const;
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
  const [startMode, setStartMode] = useState<StartMode>(() => loadStartMode());
  const [mode, setMode] = useState<Mode>(startMode);
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
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);

  // close zoom popover when tapping outside
  useEffect(() => {
    if (!zoomOpen) return;
    const onDown = (e: PointerEvent) => {
      if (zoomRef.current && !zoomRef.current.contains(e.target as Node)) {
        setZoomOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [zoomOpen]);
  const [loupeEnabled, setLoupeEnabled] = useState(() => loadLoupeEnabled());
  const [bgmEnabled, setBgmEnabled] = useState(() => loadBgmEnabled());
  const [bgmVolume, setBgmVolume] = useState(() => loadBgmVolume());
  const [sfxEnabled, setSfxEnabled] = useState(() => loadSfxEnabled());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameEditorOpen, setNameEditorOpen] = useState(false);
  const [dungeonsOpen, setDungeonsOpen] = useState(false);
  const [adventureRun, setAdventureRun] = useState<AdventureRun | null>(() => loadDungeonRun());
  const [dungeonViewOpen, setDungeonViewOpen] = useState(false);
  /** Top-level view router. The app boots at 'home'; entering 수련장 sets
   * 'training'. Modals (dungeons, smithy, profile, settings) layer on top of
   * whichever view is active. */
  const [view, setView] = useState<'home' | 'training'>('home');
  const [dungeonResult, setDungeonResult] = useState<
    { run: AdventureRun; outcome: 'won' | 'lost' } | null
  >(null);
  const { canInstall, install, standalone, platform } = usePWAInstall();
  const baseCell = useMemo(() => {
    if (availWidth <= 0) return MIN_CELL;
    const fit = availWidth / state.cols;
    return Math.max(MIN_CELL, Math.min(MAX_CELL, fit));
  }, [availWidth, state.cols]);
  const cellSize = baseCell * zoom;

  const onLoupeToggle = (enabled: boolean) => {
    setLoupeEnabled(enabled);
    saveLoupeEnabled(enabled);
  };

  const onBgmToggle = (enabled: boolean) => {
    setBgmEnabled(enabled);
    saveBgmEnabled(enabled);
  };

  const onBgmVolumeChange = (volume: number) => {
    setBgmVolume(volume);
    saveBgmVolume(volume);
  };

  const onSfxToggle = (enabled: boolean) => {
    setSfxEnabled(enabled);
    saveSfxEnabled(enabled);
  };

  // Mirror SFX settings into the singleton driver and unlock the audio
  // context on the first user gesture (iOS requirement). Volume tracks BGM
  // so the user only deals with one slider.
  useEffect(() => {
    sfxSetEnabled(sfxEnabled);
  }, [sfxEnabled]);
  useEffect(() => {
    sfxSetVolume(bgmVolume);
  }, [bgmVolume]);
  useEffect(() => {
    const unlock = () => sfxInit();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Pick the right BGM track for the current view: a dungeon run uses its
  // size-tier track, 수련장 has its own track, and the lobby falls back to
  // main. Overlays (settings/profile/picker) stay on whatever's underneath.
  const currentBgmSrc = (() => {
    if (adventureRun && dungeonViewOpen && !dungeonResult) {
      const dungeon = getDungeon(adventureRun.dungeonId);
      if (dungeon) return BGM_TRACKS[dungeon.sizeTier];
    }
    if (view === 'training') return BGM_TRACKS.training;
    return BGM_TRACKS.main;
  })();

  useBGM(currentBgmSrc, { enabled: bgmEnabled, volume: bgmVolume });

  const startDungeon = (id: string) => {
    const d = getDungeon(id);
    if (!d) return;
    const fresh = startRun(d);
    setAdventureRun(fresh);
    saveDungeonRun(fresh);
    setDungeonsOpen(false);
    setDungeonViewOpen(true);
    setDungeonResult(null);
  };

  const resumeDungeon = () => {
    setDungeonViewOpen(true);
    setDungeonsOpen(false);
  };

  const updateRun = (next: AdventureRun) => {
    setAdventureRun(next);
    saveDungeonRun(next);
  };

  const endRun = (run: AdventureRun, outcome: 'won' | 'lost') => {
    // Pay out accrued coins/XP to the wallet + progress.
    if (run.pendingCoins > 0) {
      const balance = coins + run.pendingCoins;
      setCoins(balance);
      saveCoins(balance);
    }
    if (run.pendingXp > 0) {
      const nextProgress: PlayerProgress = { ...progress, xp: progress.xp + run.pendingXp };
      setProgress(nextProgress);
      saveProgress(nextProgress);
    }
    setDungeonResult({ run, outcome });
    setAdventureRun(null);
    clearDungeonRun();
    setDungeonViewOpen(false);
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
    setMode(startMode); // every new game starts in the user's preferred mode
    setReward(null);
    setDeltas(null);
  };

  const onStartModeChange = (m: StartMode) => {
    setStartMode(m);
    saveStartMode(m);
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
    if (coins < CUSTOM_THEME_COST) return; // safety guard; UI also blocks
    const balance = coins - CUSTOM_THEME_COST;
    setCoins(balance);
    saveCoins(balance);
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

  const handleTap = (r: number, c: number, kind: 'auto' | 'reveal' | 'flag' | 'longpress' = 'auto') => {
    const cell = state.grid[r][c];
    // Long-press inverts the current mode: hold while in 깃발 mode → reveal;
    // hold while in 오픈 mode → toggle a flag.
    const effectiveKind: 'auto' | 'reveal' | 'flag' =
      kind === 'longpress' ? (mode === 'flag' ? 'reveal' : 'flag') : kind;
    let action: 'reveal' | 'flag' | 'unflag' | 'chord';
    let next: GameState;
    if (cell.state === 'revealed') {
      next = chord(state, r, c); // chording works in both modes
      action = 'chord';
    } else if (state.status === 'ready') {
      next = reveal(state, r, c); // first click always opens, even in flag mode
      action = 'reveal';
    } else if (effectiveKind === 'reveal') {
      next = reveal(state, r, c); // mouse left button
      action = 'reveal';
    } else if (effectiveKind === 'flag') {
      next = toggleFlag(state, r, c); // mouse right button
      action = cell.state === 'flagged' ? 'unflag' : 'flag';
    } else if (mode === 'flag') {
      next = toggleFlag(state, r, c);
      action = cell.state === 'flagged' ? 'unflag' : 'flag';
    } else {
      next = reveal(state, r, c);
      action = 'reveal';
    }
    if (next === state) return;
    setState(next);
    // Click feedback. End-of-game cues (boom/win/lose/coin) fire below.
    sfxPlay(action);

    // On any game end, run the progression engine (coins + xp + achievements + quests).
    if (next.status === 'won' || next.status === 'lost') {
      // Outcome cues: boom is instant, the win/lose chime trails behind so
      // it doesn't drown the click feedback.
      sfxPlay(next.status === 'won' ? 'win' : 'boom');
      if (next.status === 'lost') setTimeout(() => sfxPlay('lose'), 350);

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
      if (d.coins > 0) setTimeout(() => sfxPlay('coin'), 500);
    }
  };

  const onTogglePerk = (id: string) => {
    const level = levelInfo(progress.xp).level;
    const next = { ...progress, perksEquipped: togglePerk(progress.perksEquipped, id, perkSlots(level)) };
    setProgress(next);
    saveProgress(next);
  };

  // A dungeon run takes the screen over both home and training while active.
  const inDungeonRun = !!(adventureRun && dungeonViewOpen && !dungeonResult);

  return (
    <div className="game">
      {view === 'home' && !inDungeonRun ? (
        <Home
          account={account}
          displayName={progress.displayName}
          level={levelInfo(progress.xp).level}
          coins={coins}
          hasActiveRun={!!adventureRun}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenSmithy={() => setPickerOpen(true)}
          onOpenTraining={() => setView('training')}
          onOpenDungeons={() => setDungeonsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <>
      <header className="appbar">
        <div className="brand">
          <button
            className="home-back-btn"
            onClick={() => setView('home')}
            aria-label="홈으로"
          >
            🏠
          </button>
          <span className="brand-mark">🚩</span>
          <span className="brand-name">지뢰왕</span>
        </div>
        <div className="appbar-right">
          <button className="profile-btn" onClick={() => setProfileOpen(true)}>
            👤 Lv {levelInfo(progress.xp).level}
          </button>
          <button
            className={`theme-btn ${adventureRun ? 'has-active' : ''}`}
            onClick={() => setDungeonsOpen(true)}
            aria-label="던전"
          >
            🗡{adventureRun && <span className="dot" />}
          </button>
          <button className="theme-btn" onClick={() => setPickerOpen(true)} aria-label="대장간">
            🔨
          </button>
          <button className="theme-btn" onClick={() => setSettingsOpen(true)} aria-label="설정">
            ⚙️
          </button>
        </div>
      </header>

      {inDungeonRun ? (
        <DungeonRun
          run={adventureRun}
          perksEquipped={progress.perksEquipped}
          playerLevel={levelInfo(progress.xp).level}
          theme={theme}
          loupeEnabled={loupeEnabled}
          zoom={zoom}
          onZoomChange={setZoom}
          onRunChange={updateRun}
          onRunEnded={endRun}
          onQuit={() => {
            // Back button: just close the view. The run is preserved and can be
            // resumed via the dungeon menu's "이어하기".
            setDungeonViewOpen(false);
          }}
          onForfeit={() => {
            // Explicit "그만하기": end the run, pay out partial reward as a loss.
            endRun(adventureRun, 'lost');
          }}
        />
      ) : (
      <>
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
            zoom={zoom}
            onZoomChange={(z) => setZoom(Math.max(0.5, Math.min(2.0, z)))}
            onCellTap={handleTap}
          />
        </div>

        <div className="zoom-control" ref={zoomRef}>
          <button className="zoom-pill" onClick={() => setZoomOpen((o) => !o)} aria-label="줌">
            🔍 {Math.round(zoom * 100)}%
          </button>
          {zoomOpen && (
            <div className="zoom-popover">
              <div className="zoom-popover-head">줌 {Math.round(zoom * 100)}%</div>
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={Math.round(zoom * 100)}
                onChange={(e) => setZoom(Number(e.currentTarget.value) / 100)}
              />
              <div className="zoom-marks">
                <span>50%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>
          )}
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
      <p className="hint">
        깃발 모드여도 <b>첫 클릭은 항상 열려요</b>.<br />
        열린 숫자를 누르면 주변을 한 번에 점검(코드)해요. PC는 좌클릭=열기, 우클릭=깃발.
      </p>
      </>
      )}
        </>
      )}

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

      {dungeonsOpen && (
        <Dungeons
          activeRun={adventureRun}
          onStart={startDungeon}
          onResume={resumeDungeon}
          onClose={() => setDungeonsOpen(false)}
        />
      )}

      {dungeonResult && (
        <DungeonResult
          run={dungeonResult.run}
          outcome={dungeonResult.outcome}
          onRetry={(id) => {
            setDungeonResult(null);
            startDungeon(id);
          }}
          onClose={() => setDungeonResult(null)}
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
          coins={coins}
          onSave={saveTheme}
          onCancel={() => setEditorDraft(null)}
        />
      )}

      {settingsOpen && (
        <Settings
          loupeEnabled={loupeEnabled}
          onLoupeToggle={onLoupeToggle}
          bgmEnabled={bgmEnabled}
          onBgmToggle={onBgmToggle}
          bgmVolume={bgmVolume}
          onBgmVolumeChange={onBgmVolumeChange}
          sfxEnabled={sfxEnabled}
          onSfxToggle={onSfxToggle}
          startMode={startMode}
          onStartModeChange={onStartModeChange}
          account={account}
          canInstall={canInstall}
          onInstall={install}
          standalone={standalone}
          platform={platform}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

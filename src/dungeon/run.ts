import { BOSS_BOARD_INDEX, RUN_BOARD_COUNT, getDungeon } from './catalog';
import { rewardForBoard } from './rewards';
import type { AdventureRun, DungeonDef, RunOutcome } from './types';

/** Start a fresh run in the given dungeon. */
export function startRun(dungeon: DungeonDef, now: number = Date.now()): AdventureRun {
  return {
    dungeonId: dungeon.id,
    boardIndex: 0,
    hp: dungeon.startHp,
    maxHp: dungeon.startHp,
    boardsCleared: 0,
    pendingCoins: 0,
    pendingXp: 0,
    startedAt: now,
  };
}

/** Look up the dungeon definition for an in-flight run. */
export function dungeonOf(run: AdventureRun): DungeonDef | undefined {
  return getDungeon(run.dungeonId);
}

/**
 * Apply a board clear: pay out per-board reward, restore HP (capped at maxHp,
 * boss boards do not heal), advance to the next board. If the boss was just
 * cleared the run is complete (`outcome === 'won'`).
 */
export function applyBoardCleared(
  run: AdventureRun,
  perksEquipped: string[],
  playerLevel: number,
): { run: AdventureRun; outcome: RunOutcome } {
  const dungeon = dungeonOf(run);
  if (!dungeon) return { run, outcome: 'in-progress' };

  const reward = rewardForBoard(dungeon, run.boardIndex, perksEquipped, playerLevel);
  const justClearedBoss = run.boardIndex === BOSS_BOARD_INDEX;
  const next: AdventureRun = {
    ...run,
    boardsCleared: run.boardsCleared + 1,
    pendingCoins: run.pendingCoins + reward.coins,
    pendingXp: run.pendingXp + reward.xp,
    // No regen on the boss-clear (the run is ending anyway).
    hp: justClearedBoss
      ? run.hp
      : Math.min(run.maxHp, run.hp + dungeon.hpRegenPerBoard),
    boardIndex: justClearedBoss ? run.boardIndex : run.boardIndex + 1,
  };
  return { run: next, outcome: justClearedBoss ? 'won' : 'in-progress' };
}

/**
 * Apply a mine hit: subtract minePenalty from HP. Returns the updated run and
 * `dead: true` if HP reached zero (the run is over and player should be sent
 * to the result screen with partial rewards).
 */
export function applyMineHit(run: AdventureRun): { run: AdventureRun; dead: boolean } {
  const dungeon = dungeonOf(run);
  if (!dungeon) return { run, dead: false };
  const hp = Math.max(0, run.hp - dungeon.minePenalty);
  return { run: { ...run, hp }, dead: hp <= 0 };
}

/** Final outcome of a run when HP reached 0 mid-run (partial reward path). */
export function finalizeLoss(run: AdventureRun): { coins: number; xp: number } {
  return { coins: run.pendingCoins, xp: run.pendingXp };
}

/** Final outcome after a successful boss clear (full reward path). */
export function finalizeWin(run: AdventureRun): { coins: number; xp: number } {
  return { coins: run.pendingCoins, xp: run.pendingXp };
}

/** Convenience: how many boards remain (including the current one). */
export function boardsRemaining(run: AdventureRun): number {
  return RUN_BOARD_COUNT - run.boardsCleared;
}

/** Is the current board the boss board? */
export function isBossBoard(run: AdventureRun): boolean {
  return run.boardIndex === BOSS_BOARD_INDEX;
}

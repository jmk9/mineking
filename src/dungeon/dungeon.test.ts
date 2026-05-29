import { describe, expect, it } from 'vitest';
import { DUNGEONS, getDungeon } from './catalog';
import { rewardForBoard } from './rewards';
import {
  applyBoardCleared,
  applyMineHit,
  boardsRemaining,
  finalizeLoss,
  isBossBoard,
  startRun,
} from './run';

describe('dungeon catalog', () => {
  it('has 9 dungeons with unique ids and monotonically increasing reward multipliers', () => {
    expect(DUNGEONS).toHaveLength(9);
    const ids = new Set(DUNGEONS.map((d) => d.id));
    expect(ids.size).toBe(9);
    for (let i = 1; i < DUNGEONS.length; i++) {
      expect(DUNGEONS[i].rewardMult).toBeGreaterThan(DUNGEONS[i - 1].rewardMult);
    }
  });

  it('orders dungeons by size first, then HP regen tier', () => {
    // sizes go small -> small -> small -> medium -> medium -> ... by triples
    expect(DUNGEONS.slice(0, 3).every((d) => d.sizeTier === 'small')).toBe(true);
    expect(DUNGEONS.slice(3, 6).every((d) => d.sizeTier === 'medium')).toBe(true);
    expect(DUNGEONS.slice(6).every((d) => d.sizeTier === 'large')).toBe(true);
    // within each size, HP tier walks easy -> medium -> hard
    for (let i = 0; i < 3; i++) {
      expect(DUNGEONS[i * 3].hpRegenTier).toBe('easy');
      expect(DUNGEONS[i * 3 + 1].hpRegenTier).toBe('medium');
      expect(DUNGEONS[i * 3 + 2].hpRegenTier).toBe('hard');
    }
  });

  it('uses the public dungeon image path matching the id', () => {
    for (const d of DUNGEONS) {
      expect(d.imageUrl).toBe(`/dungeons/${d.id}.png`);
    }
  });
});

describe('rewardForBoard', () => {
  const dungeon = getDungeon('easy-small')!;

  it('pays bigger reward on the boss board than on a normal board', () => {
    const normal = rewardForBoard(dungeon, 0, [], 1);
    const boss = rewardForBoard(dungeon, 4, [], 1);
    expect(boss.coins).toBeGreaterThan(normal.coins);
    expect(boss.xp).toBeGreaterThan(normal.xp);
  });

  it('applies equipped 황금손 perk to coins', () => {
    const noPerk = rewardForBoard(dungeon, 0, [], 1).coins;
    const withGold = rewardForBoard(dungeon, 0, ['gold-hand'], 1).coins;
    expect(withGold).toBeGreaterThan(noPerk);
  });

  it('scales with dungeon multiplier', () => {
    const easy = rewardForBoard(getDungeon('easy-small')!, 0, [], 1).coins;
    const hardest = rewardForBoard(getDungeon('hard-large')!, 0, [], 1).coins;
    expect(hardest).toBeGreaterThan(easy * 3);
  });
});

describe('run state machine', () => {
  const dungeon = getDungeon('easy-small')!;

  it('starts at board 0 with full HP', () => {
    const run = startRun(dungeon, 1000);
    expect(run.boardIndex).toBe(0);
    expect(run.hp).toBe(dungeon.startHp);
    expect(run.boardsCleared).toBe(0);
    expect(boardsRemaining(run)).toBe(5);
  });

  it('advances to the next board and heals on clear', () => {
    let run = startRun(dungeon, 1000);
    // take a hit first so we can see healing
    run = applyMineHit(run).run;
    const startedHp = run.hp;
    const result = applyBoardCleared(run, [], 1);
    expect(result.outcome).toBe('in-progress');
    expect(result.run.boardIndex).toBe(1);
    expect(result.run.boardsCleared).toBe(1);
    expect(result.run.hp).toBeGreaterThan(startedHp);
    expect(result.run.pendingCoins).toBeGreaterThan(0);
  });

  it('caps HP regen at maxHp', () => {
    let run = startRun(dungeon, 1000); // full HP
    const result = applyBoardCleared(run, [], 1);
    expect(result.run.hp).toBe(run.maxHp);
  });

  it('clearing the boss board ends the run as won', () => {
    let run = startRun(dungeon, 1000);
    for (let i = 0; i < 4; i++) {
      run = applyBoardCleared(run, [], 1).run;
    }
    expect(isBossBoard(run)).toBe(true);
    const last = applyBoardCleared(run, [], 1);
    expect(last.outcome).toBe('won');
    expect(last.run.boardsCleared).toBe(5);
  });

  it('mine hits drain HP and report death at zero', () => {
    let run = startRun(dungeon, 1000);
    const penalty = dungeon.minePenalty;
    const hitsToKill = Math.ceil(dungeon.startHp / penalty);
    let dead = false;
    for (let i = 0; i < hitsToKill; i++) {
      const r = applyMineHit(run);
      run = r.run;
      dead = r.dead;
    }
    expect(dead).toBe(true);
    expect(run.hp).toBe(0);
  });

  it('partial reward on loss equals what was accrued so far', () => {
    let run = startRun(dungeon, 1000);
    run = applyBoardCleared(run, [], 1).run; // clear board 1
    run = applyBoardCleared(run, [], 1).run; // clear board 2
    const loss = finalizeLoss(run);
    expect(loss.coins).toBe(run.pendingCoins);
    expect(loss.xp).toBe(run.pendingXp);
    expect(loss.coins).toBeGreaterThan(0);
  });
});

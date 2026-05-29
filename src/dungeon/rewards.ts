import { activePerks } from '../progress/perks';
import { BOSS_BOARD_INDEX } from './catalog';
import type { DungeonDef, SizeTier } from './types';

/** Base coins per board completion, before dungeon multiplier and perks. */
const BASE_COINS: Record<SizeTier, number> = { small: 20, medium: 50, large: 100 };
/** Base XP per board completion. */
const BASE_XP: Record<SizeTier, number> = { small: 8, medium: 20, large: 40 };

/** Flat boss-clear bonus (in addition to the boss board's per-board reward). */
const BOSS_BONUS_COINS = 150;
const BOSS_BONUS_XP = 60;

export interface RawReward {
  coins: number;
  xp: number;
}

/**
 * Reward for clearing a single board within a dungeon (boards 1-4 use the
 * board reward; the boss board pays the board reward plus the boss bonus).
 *
 * Perks (e.g. 황금손 +20% coins, 수련생 +25% XP) come from the equipped meta
 * cards and are applied on top of the dungeon multiplier.
 */
export function rewardForBoard(
  dungeon: DungeonDef,
  boardIndex: number,
  perksEquipped: string[],
  playerLevel: number,
): RawReward {
  const isBoss = boardIndex === BOSS_BOARD_INDEX;
  const baseC = BASE_COINS[dungeon.sizeTier];
  const baseX = BASE_XP[dungeon.sizeTier];

  let coins = baseC * dungeon.rewardMult;
  let xp = baseX * dungeon.rewardMult;
  if (isBoss) {
    coins += BOSS_BONUS_COINS * dungeon.rewardMult;
    xp += BOSS_BONUS_XP * dungeon.rewardMult;
  }

  // Apply the player's equipped perks (same rules as the existing scoring path).
  const perks = activePerks(perksEquipped, playerLevel);
  let coinMult = 1;
  let xpMult = 1;
  let flatCoins = 0;
  for (const p of perks) {
    if (p.coinMult) coinMult *= p.coinMult;
    if (p.xpMult) xpMult *= p.xpMult;
    if (p.flatCoins) flatCoins += p.flatCoins;
  }
  coins = Math.round(coins * coinMult) + flatCoins;
  xp = Math.round(xp * xpMult);

  return { coins, xp };
}

import { perkSlots } from './level';

/**
 * Equippable perk cards. Power is bounded by the number of slots (max 3), and
 * perks are swappable rather than permanently stacking, so rewards don't run
 * away over time. Perks unlock at levels.
 */
export interface Perk {
  id: string;
  name: string;
  icon: string;
  desc: string;
  unlockLevel: number;
  coinMult?: number; // multiply final coins
  xpMult?: number; // multiply final xp
  flatCoins?: number; // add flat coins on a win
  lineMult?: { key: string; factor: number }; // boost one score line (e.g. speed)
}

export const PERKS: Perk[] = [
  { id: 'gold-hand', name: '황금손', icon: '💰', desc: '코인 획득 +20%', unlockLevel: 1, coinMult: 1.2 },
  { id: 'scholar', name: '수련생', icon: '📘', desc: '경험치 +25%', unlockLevel: 2, xpMult: 1.25 },
  { id: 'speedster', name: '질주', icon: '⚡', desc: '속도 보너스 +60%', unlockLevel: 3, lineMult: { key: 'speed', factor: 1.6 } },
  { id: 'cautious', name: '신중함', icon: '🛡️', desc: '노-플래그 보너스 2배', unlockLevel: 5, lineMult: { key: 'noflag', factor: 2 } },
  { id: 'veteran-coin', name: '노련함', icon: '🎖️', desc: '클리어 시 코인 +8', unlockLevel: 7, flatCoins: 8 },
  { id: 'prodigy', name: '천재', icon: '✨', desc: '코인·경험치 +12%', unlockLevel: 9, coinMult: 1.12, xpMult: 1.12 },
];

export function getPerk(id: string): Perk | undefined {
  return PERKS.find((p) => p.id === id);
}

export function unlockedPerks(level: number): Perk[] {
  return PERKS.filter((p) => p.unlockLevel <= level);
}

/** Equipped perks limited to the available slots for the level. */
export function activePerks(equipped: string[], level: number): Perk[] {
  const slots = perkSlots(level);
  return equipped
    .slice(0, slots)
    .map(getPerk)
    .filter((p): p is Perk => !!p);
}

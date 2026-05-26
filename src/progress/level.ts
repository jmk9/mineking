/**
 * Level / XP curve. The XP required for each level-up grows, so higher levels
 * take progressively longer. Level unlocks content (perk slots) rather than
 * raw reward multipliers, to avoid runaway power.
 */

/** XP required to advance FROM `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return Math.round(50 + (level - 1) * 35 + Math.pow(level - 1, 2) * 6);
}

export interface LevelInfo {
  level: number;
  intoLevel: number; // XP earned into the current level
  neededForNext: number; // XP required to reach the next level
}

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, intoLevel: remaining, neededForNext: xpForLevel(level) };
}

/** Equippable perk slots unlocked by level: 1 at L1, 2 at L5, 3 at L9. */
export function perkSlots(level: number): number {
  return Math.min(3, 1 + Math.floor((level - 1) / 4));
}

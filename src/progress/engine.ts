import type { DifficultyName } from '../game/types';
import type { ScoreLine } from '../game/scoring';
import { ACHIEVEMENTS, tierReward, tiersMet } from './achievements';
import { levelInfo } from './level';
import { activePerks } from './perks';
import { getQuest, pickDailyQuests, todayKey, type QuestMetric } from './quests';
import { emptyStats, type DailyQuestState, type GameResult, type PlayerProgress } from './types';

export const FAST_THRESHOLD_MS: Record<DifficultyName, number> = {
  beginner: 40_000,
  intermediate: 120_000,
  expert: 250_000,
};

export function isFastWin(r: GameResult): boolean {
  return r.won && r.timeMs > 0 && r.timeMs <= FAST_THRESHOLD_MS[r.difficulty];
}

export function freshDaily(dateKey: string = todayKey()): DailyQuestState {
  return { date: dateKey, questIds: pickDailyQuests(dateKey), progress: {}, claimed: [] };
}

export function defaultProgress(): PlayerProgress {
  return { xp: 0, stats: emptyStats(), achievements: {}, perksEquipped: [], daily: freshDaily() };
}

export interface UnlockedAchievement {
  id: string;
  name: string;
  icon: string;
  tier: number; // 1-based tier reached
}

export interface CompletedQuest {
  id: string;
  name: string;
  icon: string;
}

export interface ResultDeltas {
  coins: number;
  xp: number;
  levelBefore: number;
  levelAfter: number;
  unlockedAchievements: UnlockedAchievement[];
  completedQuests: CompletedQuest[];
}

function questIncrement(metric: QuestMetric, r: GameResult): number {
  switch (metric) {
    case 'play':
      return 1;
    case 'win':
      return r.won ? 1 : 0;
    case 'noFlagWin':
      return r.won && r.flagsUsed === 0 ? 1 : 0;
    case 'fastWin':
      return isFastWin(r) ? 1 : 0;
    case 'expertWin':
      return r.won && r.difficulty === 'expert' ? 1 : 0;
  }
}

/**
 * Apply a finished game to the player's progress. Returns a fresh progress
 * object and the deltas (coins/xp/level-ups/unlocks) for the result screen.
 */
export function applyGameResult(
  progress: PlayerProgress,
  result: GameResult,
  lines: ScoreLine[],
): { progress: PlayerProgress; deltas: ResultDeltas } {
  // deep-ish clone (plain data)
  const next: PlayerProgress = {
    xp: progress.xp,
    stats: { ...progress.stats, bestTimeMs: { ...progress.stats.bestTimeMs } },
    achievements: { ...progress.achievements },
    perksEquipped: [...progress.perksEquipped],
    daily: { ...progress.daily, progress: { ...progress.daily.progress }, claimed: [...progress.daily.claimed] },
  };

  const levelBefore = levelInfo(next.xp).level;
  const perks = activePerks(next.perksEquipped, levelBefore);

  // ----- coins from board score, adjusted by perks -----
  let coinMult = 1;
  let xpMult = 1;
  let flatCoins = 0;
  for (const p of perks) {
    if (p.coinMult) coinMult *= p.coinMult;
    if (p.xpMult) xpMult *= p.xpMult;
    if (p.flatCoins) flatCoins += p.flatCoins;
  }
  let lineTotal = 0;
  for (const line of lines) {
    let factor = 1;
    for (const p of perks) if (p.lineMult && p.lineMult.key === line.key) factor *= p.lineMult.factor;
    lineTotal += Math.round(line.coins * factor);
  }
  let coins = Math.round(lineTotal * coinMult) + (result.won ? flatCoins : 0);
  let xp = Math.round((result.won ? 10 + lineTotal * 0.5 : 3) * xpMult);

  // ----- update stats -----
  const s = next.stats;
  s.gamesPlayed += 1;
  s.cellsRevealed += result.cellsRevealed;
  if (result.won) {
    s.wins += 1;
    s.winStreak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.winStreak);
    if (result.flagsUsed === 0) s.noFlagWins += 1;
    if (isFastWin(result)) s.fastWins += 1;
    if (result.difficulty === 'expert') s.expertWins += 1;
    const best = s.bestTimeMs[result.difficulty];
    if (best == null || result.timeMs < best) s.bestTimeMs[result.difficulty] = result.timeMs;
  } else {
    s.losses += 1;
    s.winStreak = 0;
  }
  s.totalCoins += coins;

  // ----- achievements -----
  const unlockedAchievements: UnlockedAchievement[] = [];
  for (const a of ACHIEVEMENTS) {
    const claimed = next.achievements[a.id] ?? 0;
    const met = tiersMet(a.goals, a.value(s));
    if (met > claimed) {
      for (let t = claimed; t < met; t++) {
        const r = tierReward(t);
        coins += r.coins;
        xp += r.xp;
      }
      next.achievements[a.id] = met;
      unlockedAchievements.push({ id: a.id, name: a.name, icon: a.icon, tier: met });
    }
  }

  // ----- daily quests (reset if the day changed) -----
  const day = todayKey();
  if (next.daily.date !== day) next.daily = freshDaily(day);
  const completedQuests: CompletedQuest[] = [];
  for (const qid of next.daily.questIds) {
    const q = getQuest(qid);
    if (!q) continue;
    const inc = questIncrement(q.metric, result);
    if (inc > 0) next.daily.progress[qid] = (next.daily.progress[qid] ?? 0) + inc;
    const prog = next.daily.progress[qid] ?? 0;
    if (prog >= q.target && !next.daily.claimed.includes(qid)) {
      coins += q.coins;
      xp += q.xp;
      next.daily.claimed.push(qid);
      completedQuests.push({ id: q.id, name: q.name, icon: q.icon });
    }
  }

  // bonus coins also count toward lifetime totals
  s.totalCoins += coins - (result.won ? Math.round(lineTotal * coinMult) + flatCoins : 0);
  next.xp += xp;

  return {
    progress: next,
    deltas: {
      coins,
      xp,
      levelBefore,
      levelAfter: levelInfo(next.xp).level,
      unlockedAchievements,
      completedQuests,
    },
  };
}

/** Toggle a perk in/out of the equipped list, respecting slot limits at apply time. */
export function togglePerk(equipped: string[], id: string, slots: number): string[] {
  if (equipped.includes(id)) return equipped.filter((p) => p !== id);
  if (equipped.length >= slots) return equipped; // full; ignore (UI guides the user)
  return [...equipped, id];
}

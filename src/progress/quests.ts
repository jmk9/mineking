export type QuestMetric = 'win' | 'noFlagWin' | 'fastWin' | 'play' | 'expertWin';

export interface QuestDef {
  id: string;
  name: string;
  icon: string;
  metric: QuestMetric;
  target: number;
  coins: number;
  xp: number;
}

/** Pool of daily quests; 3 are chosen each day. */
export const QUEST_POOL: QuestDef[] = [
  { id: 'q-win3', name: '오늘 3승', icon: '🏅', metric: 'win', target: 3, coins: 40, xp: 30 },
  { id: 'q-win5', name: '오늘 5승', icon: '🏅', metric: 'win', target: 5, coins: 70, xp: 50 },
  { id: 'q-play5', name: '5판 플레이', icon: '🎮', metric: 'play', target: 5, coins: 30, xp: 25 },
  { id: 'q-noflag', name: '노-플래그 클리어 1회', icon: '🚩', metric: 'noFlagWin', target: 1, coins: 50, xp: 35 },
  { id: 'q-noflag2', name: '노-플래그 클리어 2회', icon: '🚩', metric: 'noFlagWin', target: 2, coins: 80, xp: 55 },
  { id: 'q-fast', name: '빠른 클리어 2회', icon: '⚡', metric: 'fastWin', target: 2, coins: 60, xp: 45 },
  { id: 'q-fast1', name: '빠른 클리어 1회', icon: '⚡', metric: 'fastWin', target: 1, coins: 35, xp: 25 },
  { id: 'q-expert', name: '고급 클리어 1회', icon: '💀', metric: 'expertWin', target: 1, coins: 90, xp: 70 },
  { id: 'q-win8', name: '오늘 8승', icon: '👑', metric: 'win', target: 8, coins: 110, xp: 80 },
  { id: 'q-play10', name: '10판 플레이', icon: '🎮', metric: 'play', target: 10, coins: 55, xp: 45 },
];

export function getQuest(id: string): QuestDef | undefined {
  return QUEST_POOL.find((q) => q.id === id);
}

export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/** Deterministically pick 3 distinct quests for a given date string. */
export function pickDailyQuests(dateKey: string): string[] {
  let seed = 0;
  for (let i = 0; i < dateKey.length; i++) seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0;
  const pool = QUEST_POOL.map((q) => q.id);
  const chosen: string[] = [];
  while (chosen.length < 3 && pool.length > 0) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const idx = seed % pool.length;
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen;
}

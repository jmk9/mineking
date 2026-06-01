import { useState } from 'react';
import {
  ACHIEVEMENTS,
  achievementGoalAtLevel,
  currentAchievementLevel,
  isAchievementDoneAtLevel,
} from '../progress/achievements';
import { levelInfo, perkSlots } from '../progress/level';
import { PERKS } from '../progress/perks';
import { getQuest } from '../progress/quests';
import type { PlayerProgress } from '../progress/types';

type Tab = 'stats' | 'achievements' | 'perks' | 'quests';

interface Props {
  progress: PlayerProgress;
  coins: number;
  account?: { name: string; onLogout: () => void };
  onTogglePerk: (id: string) => void;
  onOpenRename?: () => void;
  onClose: () => void;
}

const DIFF_LABEL: Record<string, string> = { beginner: '초급', intermediate: '중급', expert: '고급' };

function Bar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="bar">
      <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

export function ProfilePage({ progress, coins, account, onTogglePerk, onOpenRename, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('stats');
  const { level, intoLevel, neededForNext } = levelInfo(progress.xp);
  const slots = perkSlots(level);
  const s = progress.stats;
  const winRate = s.gamesPlayed ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="profile-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>프로필</span>
          <button className="picker-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="level-header">
          <div className="level-badge">Lv {level}</div>
          <div className="level-bar-wrap">
            <div className="level-xp">
              XP {intoLevel} / {neededForNext}
            </div>
            <Bar pct={(intoLevel / neededForNext) * 100} />
          </div>
          <div className="coin-pill">🪙 {coins}</div>
        </div>

        {account && (
          <div className="profile-id-row">
            <span className="profile-id-emoji">👤</span>
            <div className="profile-id-main">
              <span className="profile-id-name">
                {progress.displayName || account.name}
              </span>
              {progress.displayName && (
                <span className="profile-id-handle">@{account.name}</span>
              )}
            </div>
            {onOpenRename && (
              <button className="rename-btn" onClick={onOpenRename} aria-label="이름 변경">
                ✏️
              </button>
            )}
          </div>
        )}

        <div className="tabs">
          {(
            [
              ['stats', '스탯'],
              ['achievements', '훈장'],
              ['perks', '카드'],
              ['quests', '퀘스트'],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </div>

        <div className="tab-body">
          {tab === 'stats' && (
            <ul className="stat-list">
              <li><span>승리</span><b>{s.wins}</b></li>
              <li><span>승률</span><b>{winRate}%</b></li>
              <li><span>최고 연승</span><b>{s.bestStreak}</b></li>
              <li><span>노-플래그 클리어</span><b>{s.noFlagWins}</b></li>
              <li><span>빠른 클리어</span><b>{s.fastWins}</b></li>
              <li><span>고급 클리어</span><b>{s.expertWins}</b></li>
              <li><span>개척한 칸</span><b>{s.cellsRevealed.toLocaleString()}</b></li>
              <li><span>누적 코인</span><b>{s.totalCoins.toLocaleString()}</b></li>
              {(['beginner', 'intermediate', 'expert'] as const).map((d) =>
                s.bestTimeMs[d] != null ? (
                  <li key={d}>
                    <span>최고 기록 ({DIFF_LABEL[d]})</span>
                    <b>{(s.bestTimeMs[d]! / 1000).toFixed(1)}초</b>
                  </li>
                ) : null,
              )}
            </ul>
          )}

          {tab === 'achievements' && (() => {
            const achLevel = currentAchievementLevel(progress.achievements);
            const maxLevel = Math.max(...ACHIEVEMENTS.map((a) => a.goals.length));
            const isMaxLevel = achLevel > maxLevel;
            return (
              <div className="ach-list">
                <div className="ach-level-header">
                  <span className="ach-level-badge">🏆 훈장 레벨 {Math.min(achLevel, maxLevel)}</span>
                  {!isMaxLevel && (
                    <span className="ach-level-sub">모든 임무 완료 시 다음 레벨 해금</span>
                  )}
                </div>

                {ACHIEVEMENTS.map((a) => {
                  const claimed = progress.achievements[a.id] ?? 0;
                  const value = a.value(s);
                  const goal = achievementGoalAtLevel(a, achLevel);
                  const done = isAchievementDoneAtLevel(a, claimed, achLevel);
                  const capped = achLevel >= a.goals.length;
                  return (
                    <div key={a.id} className={`ach-row ${done ? 'earned' : ''}`}>
                      <span className="ach-icon">{a.icon}</span>
                      <div className="ach-meta">
                        <div className="ach-top">
                          <span className="ach-name">{a.name}</span>
                          <span className="ach-tier">
                            {done ? (capped ? 'MAX' : '✓') : `Lv ${achLevel}`}
                          </span>
                        </div>
                        <div className="ach-desc">{a.desc}</div>
                        <Bar pct={done ? 100 : (value / goal) * 100} />
                        <div className="ach-prog">
                          {Math.min(value, goal).toLocaleString()} / {goal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!isMaxLevel && (
                  <div className="ach-locked-row">
                    🔒 Lv {achLevel + 1} 잠금 — 현재 레벨 임무를 모두 완료해야 해금
                  </div>
                )}
                {isMaxLevel && (
                  <div className="ach-locked-row">
                    🌟 모든 훈장 레벨을 달성했어요!
                  </div>
                )}
              </div>
            );
          })()}

          {tab === 'perks' && (
            <div className="perk-list">
              <p className="perk-slots-info">장착 슬롯 {progress.perksEquipped.length}/{slots} · 레벨업으로 슬롯이 늘어요</p>
              {PERKS.map((p) => {
                const locked = p.unlockLevel > level;
                const equipped = progress.perksEquipped.includes(p.id);
                const full = progress.perksEquipped.length >= slots;
                return (
                  <div key={p.id} className={`perk-row ${equipped ? 'equipped' : ''} ${locked ? 'locked' : ''}`}>
                    <span className="perk-icon">{p.icon}</span>
                    <div className="perk-meta">
                      <span className="perk-name">{p.name}</span>
                      <span className="perk-desc">{locked ? `🔒 Lv ${p.unlockLevel} 해금` : p.desc}</span>
                    </div>
                    {!locked && (
                      <button
                        className={`perk-btn ${equipped ? 'on' : ''}`}
                        disabled={!equipped && full}
                        onClick={() => onTogglePerk(p.id)}
                      >
                        {equipped ? '해제' : full ? '슬롯참' : '장착'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'quests' && (
            <div className="quest-list">
              <p className="quest-info">매일 자정에 새 퀘스트로 바뀌어요</p>
              {progress.daily.questIds.map((qid) => {
                const q = getQuest(qid);
                if (!q) return null;
                const prog = progress.daily.progress[qid] ?? 0;
                const done = progress.daily.claimed.includes(qid);
                return (
                  <div key={qid} className={`quest-row ${done ? 'done' : ''}`}>
                    <span className="quest-icon">{q.icon}</span>
                    <div className="quest-meta">
                      <div className="quest-top">
                        <span className="quest-name">{q.name}</span>
                        <span className="quest-reward">🪙{q.coins} · XP{q.xp}</span>
                      </div>
                      <Bar pct={(prog / q.target) * 100} color={done ? '#22c55e' : undefined} />
                      <div className="quest-prog">
                        {done ? '완료 ✓' : `${Math.min(prog, q.target)} / ${q.target}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

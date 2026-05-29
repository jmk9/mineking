import { getDungeon } from '../dungeon/catalog';
import type { AdventureRun } from '../dungeon/types';

interface Props {
  run: AdventureRun;
  /** 'won' = boss cleared, 'lost' = HP reached zero. */
  outcome: 'won' | 'lost';
  /** Start a new run in the same dungeon (loss only). */
  onRetry: (dungeonId: string) => void;
  onClose: () => void;
}

export function DungeonResult({ run, outcome, onRetry, onClose }: Props) {
  const dungeon = getDungeon(run.dungeonId);
  const won = outcome === 'won';
  return (
    <div className="overlay">
      <div className="result-card">
        <div className="result-title">
          {won ? '🏆 던전 완수!' : '💥 도전 실패'}
        </div>
        {!won && (
          <p className="result-sub">
            {run.boardsCleared}/5 보드 클리어 · 깨고 온 만큼 보상이 지급돼요
          </p>
        )}

        {dungeon && (
          <div className="dungeon-result-meta">
            {dungeon.name} · Lv {dungeon.rank}
          </div>
        )}

        <div className="reward-summary">
          <div className="reward-chip">
            <span className="reward-label">코인</span>
            <span className="coin">+{run.pendingCoins} 🪙</span>
          </div>
          <div className="reward-chip">
            <span className="reward-label">경험치</span>
            <span className="xp">+{run.pendingXp} XP</span>
          </div>
        </div>

        {won ? (
          <button className="result-btn" onClick={onClose}>
            돌아가기
          </button>
        ) : (
          <div className="row-buttons">
            <button className="tool" onClick={onClose}>
              돌아가기
            </button>
            <button className="result-btn" onClick={() => onRetry(run.dungeonId)}>
              다시 도전
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

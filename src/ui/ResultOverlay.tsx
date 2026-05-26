import type { GameStatus } from '../game/types';
import type { ScoreBreakdown } from '../game/scoring';
import type { ResultDeltas } from '../progress/engine';

interface Props {
  status: GameStatus;
  score: ScoreBreakdown;
  deltas: ResultDeltas;
  balance: number;
  onNewGame: () => void;
}

export function ResultOverlay({ status, score, deltas, balance, onNewGame }: Props) {
  const won = status === 'won';
  const leveledUp = deltas.levelAfter > deltas.levelBefore;

  return (
    <div className="overlay" onClick={onNewGame}>
      <div className="result-card" onClick={(e) => e.stopPropagation()}>
        <div className="result-title">{won ? '🎉 클리어!' : '💥 실패'}</div>

        {leveledUp && (
          <div className="levelup-banner">⬆️ 레벨 업! Lv {deltas.levelBefore} → Lv {deltas.levelAfter}</div>
        )}

        {won && score.lines.length > 0 && (
          <ul className="score-lines">
            {score.lines.map((l) => (
              <li key={l.key}>
                <span>{l.label}</span>
                <span className="coin">+{l.coins} 🪙</span>
              </li>
            ))}
          </ul>
        )}

        {!won && <p className="result-sub">지뢰를 밟았어요. 다음 기회에!</p>}

        <div className="reward-summary">
          <div className="reward-chip">
            <span className="reward-label">코인</span>
            <span className="coin">+{deltas.coins} 🪙</span>
          </div>
          <div className="reward-chip">
            <span className="reward-label">경험치</span>
            <span className="xp">+{deltas.xp} XP</span>
          </div>
        </div>

        {deltas.unlockedAchievements.length > 0 && (
          <div className="unlock-block">
            <div className="unlock-title">🏅 훈장 달성</div>
            {deltas.unlockedAchievements.map((a) => (
              <div key={a.id} className="unlock-row">
                {a.icon} {a.name} {a.tier > 1 ? `T${a.tier}` : ''}
              </div>
            ))}
          </div>
        )}

        {deltas.completedQuests.length > 0 && (
          <div className="unlock-block">
            <div className="unlock-title">✅ 퀘스트 완료</div>
            {deltas.completedQuests.map((q) => (
              <div key={q.id} className="unlock-row">
                {q.icon} {q.name}
              </div>
            ))}
          </div>
        )}

        <div className="result-balance">보유 코인: {balance} 🪙</div>
        <button className="result-btn" onClick={onNewGame}>
          새 게임
        </button>
      </div>
    </div>
  );
}

import { DUNGEONS } from '../dungeon/catalog';
import type { AdventureRun } from '../dungeon/types';

interface Props {
  /** Currently in-progress run (null = none), so we can offer "이어하기". */
  activeRun: AdventureRun | null;
  /** Start a new run in the given dungeon (will abandon any active run). */
  onStart: (dungeonId: string) => void;
  /** Resume the in-progress run. */
  onResume: () => void;
  onClose: () => void;
}

export function Dungeons({ activeRun, onStart, onResume, onClose }: Props) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dungeons-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>사냥터</span>
          <button className="picker-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {activeRun && (
          <button className="dungeon-resume" onClick={onResume}>
            ▶ 이어하기 — {DUNGEONS.find((d) => d.id === activeRun.dungeonId)?.name ?? '진행 중'}{' '}
            (보드 {activeRun.boardsCleared + 1}/5, HP {activeRun.hp}/{activeRun.maxHp})
          </button>
        )}

        <div className="dungeon-grid">
          {DUNGEONS.map((d) => (
            <button
              key={d.id}
              className="dungeon-card"
              onClick={() => {
                if (activeRun && !confirm('진행 중인 런이 있어요. 포기하고 새로 시작할까요?')) return;
                onStart(d.id);
              }}
            >
              <div
                className="dungeon-card-image"
                style={{ backgroundImage: `url(${d.imageUrl})` }}
              >
                <span className="dungeon-card-rank">Lv {d.rank}</span>
              </div>
              <div className="dungeon-card-text">
                <span className="dungeon-card-name">{d.name}</span>
                <span className="dungeon-card-sub">{d.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

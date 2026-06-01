import { DUNGEONS } from '../dungeon/catalog';
import type { AdventureRun, HpRegenTier, SizeTier } from '../dungeon/types';

interface Props {
  /** Currently in-progress run (null = none), so we can offer "이어하기". */
  activeRun: AdventureRun | null;
  /** Start a new run in the given dungeon (will abandon any active run). */
  onStart: (dungeonId: string) => void;
  /** Resume the in-progress run. */
  onResume: () => void;
  onClose: () => void;
}

/** Short on-image labels. The full sentence still lives in d.subtitle for
 *  screen readers — these chips are the visual at-a-glance read. */
const SIZE_CHIP: Record<SizeTier, string> = {
  small: '초급',
  medium: '중급',
  large: '고급',
};
const HEAL_CHIP: Record<HpRegenTier, string> = {
  easy: '❤️ +30',
  medium: '❤️ +15',
  hard: '❤️ ✕',
};

export function Dungeons({ activeRun, onStart, onResume, onClose }: Props) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dungeons-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>던전</span>
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
                aria-label={d.subtitle}
              >
                <span className="dungeon-card-rank">Lv {d.rank}</span>
                <span className="dungeon-card-size">{SIZE_CHIP[d.sizeTier]}</span>
                <span className="dungeon-card-heal">{HEAL_CHIP[d.hpRegenTier]}</span>
              </div>
              <div className="dungeon-card-text">
                <span className="dungeon-card-name">{d.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { PRESETS, themePrice } from '../render/presets';
import { isCustom } from '../render/customTheme';
import type { Theme } from '../render/theme';
import { ThemeSwatch } from './ThemeSwatch';

interface Props {
  activeId: string;
  customThemes: Theme[];
  unlockedIds: string[];
  coins: number;
  onSelect: (id: string) => void;
  onBuy: (id: string, price: number) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function ThemePicker({
  activeId,
  customThemes,
  unlockedIds,
  coins,
  onSelect,
  onBuy,
  onDelete,
  onCreate,
  onClose,
}: Props) {
  const themes = [...PRESETS, ...customThemes];

  const isOwned = (t: Theme) => isCustom(t.id) || t.tier === 0 || unlockedIds.includes(t.id);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="picker-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>대장간</span>
          <span className="picker-coins">🪙 {coins}</span>
          <button className="picker-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="smithy-coming-soon">
          ⚒️ <b>장비 시스템</b>은 곧 등장해요. 지금은 <b>테마</b>를 꾸며볼 수 있어요.
        </div>

        <div className="shop-section-title">테마</div>

        <div className="theme-list">
          {themes.map((theme) => {
            const owned = isOwned(theme);
            const price = themePrice(theme);
            return (
              <div
                key={theme.id}
                className={`theme-row ${theme.id === activeId ? 'active' : ''} ${owned ? '' : 'locked'}`}
                onClick={() => owned && onSelect(theme.id)}
              >
                <ThemeSwatch theme={theme} />
                <div className="theme-meta">
                  <span className="theme-name">{theme.name}</span>
                  {isCustom(theme.id) ? (
                    <span className="theme-tier">내 테마</span>
                  ) : owned ? (
                    theme.tier > 0 && <span className="theme-tier">보유</span>
                  ) : (
                    <span className="theme-price">🪙 {price}</span>
                  )}
                </div>

                {theme.id === activeId && <span className="theme-check">✓</span>}

                {isCustom(theme.id) && (
                  <button
                    className="theme-del"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(theme.id);
                    }}
                  >
                    🗑
                  </button>
                )}

                {!owned && (
                  <button
                    className="buy-btn"
                    disabled={coins < price}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBuy(theme.id, price);
                    }}
                  >
                    {coins < price ? '코인 부족' : '구매'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button className="create-btn" onClick={onCreate}>
          ＋ 새 테마 만들기
        </button>
      </div>
    </div>
  );
}

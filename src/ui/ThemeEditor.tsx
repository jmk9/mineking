import { useRef, useState } from 'react';
import { buildCustomTheme, newCustomId, type ThemeDraft } from '../render/customTheme';
import type { FlagShape, Theme } from '../render/theme';
import { ThemeSwatch } from './ThemeSwatch';
import { DrawPad } from './DrawPad';
import { fileToGlyph } from './imageUtil';

type Slot = 'flag' | number; // number = 1..8
const slotLabel = (s: Slot) => (s === 'flag' ? '깃발' : String(s));

const FLAG_SHAPES: { value: FlagShape; label: string }[] = [
  { value: 'triangle', label: '삼각' },
  { value: 'banner', label: '배너' },
  { value: 'pennant', label: '페넌트' },
];

interface Props {
  initial: ThemeDraft;
  onSave: (theme: Theme) => void;
  onCancel: () => void;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function ThemeEditor({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<ThemeDraft>(initial);
  const [slot, setSlot] = useState<Slot>('flag');
  const [drawOpen, setDrawOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<ThemeDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setNumber = (n: number, v: string) =>
    setDraft((d) => ({ ...d, numberColors: { ...d.numberColors, [n]: v } }));

  const glyphOf = (s: Slot): string | undefined =>
    s === 'flag' ? draft.flagImage : draft.numberImages[s];

  const setGlyph = (s: Slot, url: string | undefined) =>
    setDraft((d) => {
      if (s === 'flag') return { ...d, flagImage: url };
      const next = { ...d.numberImages };
      if (url) next[s] = url;
      else delete next[s];
      return { ...d, numberImages: next };
    });

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      setGlyph(slot, await fileToGlyph(file));
    } catch {
      /* ignore bad files */
    }
  };

  const preview = buildCustomTheme(draft, 'preview');
  const slots: Slot[] = ['flag', 1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="editor-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>테마 만들기</span>
          <button className="picker-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="editor-preview">
          <ThemeSwatch theme={preview} cell={40} />
        </div>

        <div className="editor-body">
          <label className="text-field">
            <span>이름</span>
            <input
              type="text"
              value={draft.name}
              maxLength={20}
              onChange={(e) => set({ name: e.target.value })}
            />
          </label>

          <div className="field-group">
            <span className="group-label">깃발 모양</span>
            <div className="shape-row">
              {FLAG_SHAPES.map((s) => (
                <button
                  key={s.value}
                  className={draft.flagShape === s.value ? 'active' : ''}
                  onClick={() => set({ flagShape: s.value })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <span className="group-label">색상</span>
            <div className="color-grid">
              <ColorField label="배경" value={draft.bg} onChange={(v) => set({ bg: v })} />
              <ColorField label="닫힌 칸" value={draft.hidden} onChange={(v) => set({ hidden: v })} />
              <ColorField label="열린 칸" value={draft.revealed} onChange={(v) => set({ revealed: v })} />
              <ColorField label="깃발" value={draft.flag} onChange={(v) => set({ flag: v })} />
            </div>
          </div>

          <div className="field-group">
            <span className="group-label">숫자 색 (1~8)</span>
            <div className="color-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <ColorField
                  key={n}
                  label={String(n)}
                  value={draft.numberColors[n]}
                  onChange={(v) => setNumber(n, v)}
                />
              ))}
            </div>
          </div>

          <div className="field-group">
            <span className="group-label">이미지 / 그림 (선택)</span>
            <div className="glyph-grid">
              {slots.map((s) => {
                const url = glyphOf(s);
                return (
                  <button
                    key={String(s)}
                    className={`glyph-slot ${slot === s ? 'active' : ''}`}
                    onClick={() => setSlot(s)}
                  >
                    {url ? (
                      <img src={url} alt={slotLabel(s)} />
                    ) : (
                      <span
                        className="glyph-default"
                        style={{ color: s === 'flag' ? draft.flag : draft.numberColors[s] }}
                      >
                        {s === 'flag' ? '🚩' : s}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="glyph-actions">
              <button className="tool" onClick={() => setDrawOpen(true)}>
                ✏️ 그리기
              </button>
              <button className="tool" onClick={() => fileRef.current?.click()}>
                📁 업로드
              </button>
              <button className="tool" onClick={() => setGlyph(slot, undefined)}>
                기본값
              </button>
            </div>
            <p className="glyph-hint">슬롯을 고른 뒤 그리거나 이미지를 올리세요 · 선택: {slotLabel(slot)}</p>
          </div>
        </div>

        <button className="result-btn" onClick={() => onSave(buildCustomTheme(draft, newCustomId()))}>
          저장
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            onUpload(e.target.files?.[0]);
            e.currentTarget.value = '';
          }}
        />
      </div>

      {drawOpen && (
        <DrawPad
          title={slotLabel(slot)}
          onSave={(url) => {
            setGlyph(slot, url);
            setDrawOpen(false);
          }}
          onCancel={() => setDrawOpen(false)}
        />
      )}
    </div>
  );
}

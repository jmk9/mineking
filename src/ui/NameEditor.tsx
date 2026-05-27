import { useState } from 'react';

interface Props {
  initial?: string;
  username: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function NameEditor({ initial, username, onSave, onClose }: Props) {
  const [name, setName] = useState(initial ?? '');
  const trimmed = name.trim();

  const save = () => {
    onSave(trimmed); // empty string = clear (falls back to username)
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>표시 이름</span>
          <button className="picker-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className="text-field">
          <span>이름</span>
          <input
            type="text"
            value={name}
            maxLength={20}
            placeholder={username}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
          />
        </label>
        <p className="setting-desc">비워두면 아이디({username})로 표시돼요</p>

        <div className="row-buttons">
          <button className="tool" onClick={onClose}>
            취소
          </button>
          <button className="result-btn" onClick={save}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

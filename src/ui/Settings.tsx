import { useState } from 'react';
import { InstallHelp } from './InstallHelp';
import type { Platform } from './usePWAInstall';

interface Props {
  loupeEnabled: boolean;
  onLoupeToggle: (enabled: boolean) => void;
  bgmEnabled: boolean;
  onBgmToggle: (enabled: boolean) => void;
  bgmVolume: number;
  onBgmVolumeChange: (volume: number) => void;
  sfxEnabled: boolean;
  onSfxToggle: (enabled: boolean) => void;
  account?: { name: string; onLogout: () => void };
  canInstall?: boolean;
  onInstall?: () => void;
  standalone?: boolean;
  platform?: Platform;
  onClose: () => void;
}

export function Settings({
  loupeEnabled,
  onLoupeToggle,
  bgmEnabled,
  onBgmToggle,
  bgmVolume,
  onBgmVolumeChange,
  sfxEnabled,
  onSfxToggle,
  account,
  canInstall,
  onInstall,
  standalone,
  platform = 'other',
  onClose,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = () => {
    onClose();
    account?.onLogout();
  };

  const handleInstall = () => {
    if (canInstall) {
      onInstall?.();
      onClose();
    } else {
      setHelpOpen(true);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>설정</span>
          <button className="picker-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <ToggleRow
          label="돋보기 사용"
          desc="터치한 위치를 동그란 확대뷰로 보여줘요"
          checked={loupeEnabled}
          onChange={onLoupeToggle}
        />

        <ToggleRow
          label="배경 음악(BGM)"
          desc="모드별 음악을 자동으로 틀어줍니다"
          checked={bgmEnabled}
          onChange={onBgmToggle}
        />

        <ToggleRow
          label="효과음"
          desc="셀 열기·깃발·폭발 같은 짧은 소리"
          checked={sfxEnabled}
          onChange={onSfxToggle}
        />

        {bgmEnabled && (
          <div className="setting-row">
            <div className="setting-text">
              <span className="setting-label">볼륨</span>
              <span className="setting-desc">{bgmVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={bgmVolume}
              onChange={(e) => onBgmVolumeChange(Number(e.currentTarget.value))}
              className="volume-slider"
              aria-label="BGM 볼륨"
            />
          </div>
        )}

        {!standalone && (
          <button className="install-btn" onClick={handleInstall}>
            📲 앱 설치{canInstall ? '' : ' 안내'}
          </button>
        )}

        {account && (
          <button className="logout-full-btn" onClick={handleLogout}>
            로그아웃 ({account.name})
          </button>
        )}

        {helpOpen && <InstallHelp platform={platform} onClose={() => setHelpOpen(false)} />}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <div className="setting-text">
        <span className="setting-label">{label}</span>
        {desc && <span className="setting-desc">{desc}</span>}
      </div>
      <button
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-label={label}
        aria-pressed={checked}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

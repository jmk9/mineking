import { useState } from 'react';
import { InstallHelp } from './InstallHelp';
import type { Platform } from './usePWAInstall';

interface Props {
  loupeEnabled: boolean;
  onLoupeToggle: (enabled: boolean) => void;
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

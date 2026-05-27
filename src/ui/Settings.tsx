interface Props {
  zoomEnabled: boolean;
  onZoomToggle: (enabled: boolean) => void;
  onClose: () => void;
}

export function Settings({ zoomEnabled, onZoomToggle, onClose }: Props) {
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
          label="줌 사용"
          desc="보드 확대/축소 컨트롤을 표시합니다"
          checked={zoomEnabled}
          onChange={onZoomToggle}
        />
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

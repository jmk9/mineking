import type { Platform } from './usePWAInstall';

interface Props {
  platform: Platform;
  onClose: () => void;
}

export function InstallHelp({ platform, onClose }: Props) {
  return (
    <div
      className="overlay"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>앱으로 설치</span>
          <button className="picker-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {platform === 'ios' && (
          <ol className="install-steps">
            <li>
              <b>Safari</b>로 이 사이트를 여세요 (Chrome 등 다른 브라우저는 지원 안 됨)
            </li>
            <li>
              하단의 <b>공유 버튼</b> (네모 + 위 화살표)을 누르세요
            </li>
            <li>
              <b>"홈 화면에 추가"</b>를 선택하면 끝!
            </li>
          </ol>
        )}

        {platform === 'android' && (
          <ol className="install-steps">
            <li>
              Chrome 우측 상단 <b>⋮ 메뉴</b>를 누르세요
            </li>
            <li>
              <b>"앱 설치"</b> 또는 <b>"홈 화면에 추가"</b>를 선택하세요
            </li>
            <li>한 번 설치/제거한 적이 있다면 잠시 후 다시 시도해 보세요</li>
          </ol>
        )}

        {platform === 'other' && (
          <ol className="install-steps">
            <li>
              브라우저 메뉴에서 <b>"앱 설치"</b> 또는 <b>"홈 화면에 추가"</b>를 찾아 누르세요
            </li>
          </ol>
        )}
      </div>
    </div>
  );
}

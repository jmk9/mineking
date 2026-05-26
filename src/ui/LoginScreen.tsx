import { useState } from 'react';

interface Props {
  onAuth: (mode: 'login' | 'signup', username: string, password: string) => void;
  onOffline: () => void;
  busy: boolean;
  error: string | null;
}

export function LoginScreen({ onAuth, onOffline, busy, error }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const valid = username.trim().length >= 2 && password.length >= 6;

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">🚩</span>
          <span className="brand-name">지뢰왕</span>
        </div>
        <p className="login-sub">로그인하면 진행도가 클라우드에 저장돼 어디서나 이어서 즐길 수 있어요.</p>

        <div className="segmented login-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            로그인
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            회원가입
          </button>
        </div>

        <label className="text-field">
          <span>아이디</span>
          <input
            type="text"
            value={username}
            autoCapitalize="none"
            autoCorrect="off"
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="2자 이상"
          />
        </label>
        <label className="text-field">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            maxLength={64}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button
          className="result-btn"
          disabled={!valid || busy}
          onClick={() => onAuth(mode, username, password)}
        >
          {busy ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <button className="login-offline" onClick={onOffline}>
          로그인 없이 이 기기에서만 플레이
        </button>
      </div>
    </div>
  );
}

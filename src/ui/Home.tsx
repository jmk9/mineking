interface Props {
  /** Logged-in account, if any. The login chip appears when present. */
  account?: { name: string };
  /** Current display name (falls back to account name or "Guest"). */
  displayName?: string;
  /** Player level for the profile chip. */
  level: number;
  /** Wallet balance for the coin chip. */
  coins: number;
  /** True if an unfinished dungeon run is sitting in storage. */
  hasActiveRun: boolean;

  onOpenProfile: () => void;
  onOpenSmithy: () => void;
  onOpenTraining: () => void;
  onOpenDungeons: () => void;
  onOpenSettings: () => void;
}

/**
 * Lobby/home screen. Four big tiles route into the rest of the app; profile
 * + settings stay reachable from a corner chip so they also work from inside
 * 수련장 / 던전.
 */
export function Home({
  account,
  displayName,
  level,
  coins,
  hasActiveRun,
  onOpenProfile,
  onOpenSmithy,
  onOpenTraining,
  onOpenDungeons,
  onOpenSettings,
}: Props) {
  const name = displayName?.trim() || account?.name || 'Guest';
  return (
    <div className="home">
      <header className="home-header">
        <div className="home-greeting">
          <span className="home-hi">반가워요</span>
          <span className="home-name">{name}</span>
        </div>
        <div className="home-header-right">
          <button className="home-coin-chip" onClick={onOpenSmithy} aria-label="대장간 열기">
            🪙 {coins}
          </button>
          <button className="home-profile-chip" onClick={onOpenProfile} aria-label="프로필 열기">
            👤 Lv {level}
          </button>
          <button className="home-icon-btn" onClick={onOpenSettings} aria-label="설정">
            ⚙️
          </button>
        </div>
      </header>

      <div className="home-grid">
        <HomeCard
          accent="profile"
          title="내 프로필"
          desc="훈장 · 퀘스트 · 통계"
          onClick={onOpenProfile}
        />
        <HomeCard
          accent="smithy"
          title="대장간"
          desc="테마·장비 (장비 곧 등장)"
          onClick={onOpenSmithy}
        />
        <HomeCard
          accent="training"
          title="수련장"
          desc="초·중·고급 자유 플레이"
          onClick={onOpenTraining}
        />
        <HomeCard
          accent="dungeon"
          title="던전"
          desc="9개 던전 · 한 런 5보드"
          badge={hasActiveRun ? '진행 중' : undefined}
          onClick={onOpenDungeons}
        />
      </div>
    </div>
  );
}

function HomeCard({
  accent,
  title,
  desc,
  badge,
  onClick,
}: {
  accent: 'profile' | 'smithy' | 'training' | 'dungeon';
  title: string;
  desc: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button className={`home-card home-card-${accent}`} onClick={onClick}>
      {badge && <span className="home-card-badge">{badge}</span>}
      <span className="home-card-title">{title}</span>
      <span className="home-card-desc">{desc}</span>
    </button>
  );
}

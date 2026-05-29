import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { cloudEnabled, supabase, usernameToEmail } from '../cloud/supabase';
import { applySave, clearLocalSave, collectSave, pullCloud, pushCloud, saveSignature } from '../cloud/sync';
import { Game } from './Game';
import { LoginScreen } from './LoginScreen';

type Phase = 'init' | 'login' | 'syncing' | 'ready';

function emailToName(email: string | undefined): string {
  return email ? email.split('@')[0] : '플레이어';
}

function translateError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return '아이디 또는 비밀번호가 올바르지 않아요.';
  if (/already registered|already exists/i.test(msg)) return '이미 존재하는 아이디예요.';
  if (/password should be at least/i.test(msg)) return '비밀번호는 6자 이상이어야 해요.';
  return msg;
}

export function AuthGate() {
  const [phase, setPhase] = useState<Phase>('init');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const account = session ? emailToName(session.user.email) : null;

  // Boot: if cloud isn't configured, play locally. Otherwise check for a session.
  useEffect(() => {
    if (!cloudEnabled || !supabase) {
      setPhase('ready');
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) syncOnLogin(data.session);
      else setPhase('login');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setPhase('login');
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncOnLogin(s: Session) {
    setSession(s);
    setPhase('syncing');
    const cloud = await pullCloud(s.user.id);
    if (cloud) applySave(cloud);
    else await pushCloud(s.user.id, collectSave()); // first login: seed cloud from this device
    setPhase('ready');
  }

  // Debounced background push while logged in.
  useEffect(() => {
    if (phase !== 'ready' || !session || !supabase) return;
    let last = saveSignature();
    const id = setInterval(() => {
      const sig = saveSignature();
      if (sig !== last) {
        last = sig;
        pushCloud(session.user.id, collectSave());
      }
    }, 4000);
    const onUnload = () => pushCloud(session.user.id, collectSave());
    window.addEventListener('beforeunload', onUnload);
    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [phase, session]);

  const handleAuth = async (mode: 'login' | 'signup', username: string, password: string) => {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const email = usernameToEmail(username);
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return setError(translateError(error.message));
        // Supabase returns a fake user with empty `identities` when the email
        // is already in use (to prevent enumeration). Treat that as a duplicate.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          return setError('이미 사용 중인 아이디예요.');
        }
        if (!data.session) {
          return setError('이메일 확인 설정이 켜져 있어요. Supabase에서 "Confirm email"을 꺼주세요.');
        }
        clearLocalSave(); // new account starts fresh
        await syncOnLogin(data.session);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setError(translateError(error.message));
        await syncOnLogin(data.session);
      }
    } catch (e) {
      setError('연결에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    // Push one last time so nothing local is lost, then wipe the device save
    // so the next visitor (login screen / 게스트 모드) starts from a clean
    // slate instead of inheriting the previous account's coins, level, and
    // themes. The next successful login will repopulate from the cloud.
    if (supabase && session) await pushCloud(session.user.id, collectSave());
    await supabase?.auth.signOut();
    clearLocalSave();
    setSession(null);
    setOffline(false);
    setPhase('login');
  };

  if (phase === 'init' || phase === 'syncing') {
    return <div className="loading-screen">{phase === 'syncing' ? '진행도 불러오는 중…' : ''}</div>;
  }

  if (cloudEnabled && phase === 'login' && !offline) {
    return <LoginScreen onAuth={handleAuth} onOffline={() => setOffline(true)} busy={busy} error={error} />;
  }

  return <Game account={account ? { name: account, onLogout: logout } : undefined} />;
}

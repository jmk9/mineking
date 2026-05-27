import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Platform = 'ios' | 'android' | 'other';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari sets navigator.standalone when launched from home screen
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

/**
 * Capture `beforeinstallprompt` so we can offer our own install button on
 * Chromium-based browsers, and report platform/standalone so callers can
 * show manual instructions where the native prompt isn't available (iOS).
 */
export function usePWAInstall() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(detectStandalone);
  const platform: Platform = detectPlatform();

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setStandalone(true);
      setEvt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    setEvt(null);
  };

  return {
    canInstall: !!evt && !standalone,
    install,
    standalone,
    platform,
  };
}

import { useEffect, useRef } from 'react';

interface Options {
  enabled: boolean;
  /** Volume 0..100. */
  volume: number;
}

/**
 * Background music driver. Holds a single looping <audio> element and plays
 * whatever URL is passed as `src`. Missing files, autoplay blocks, and quick
 * track swaps are all handled silently — the UI never crashes if BGM is
 * absent. Mobile browsers gate playback behind a user gesture; the first tap
 * anywhere in the app unblocks playback automatically.
 *
 * Pass `null` as `src` to silence the current track (used when the catalog
 * has no track for the current view yet).
 */
export function useBGM(src: string | null, opts: Options): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSrcRef = useRef<string | null>(null);
  const unlockedRef = useRef(false);
  const desiredSrcRef = useRef<string | null>(src);
  const enabledRef = useRef(opts.enabled);

  // Create the element once.
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = opts.volume / 100;
    audioRef.current = audio;

    // Unblock playback after the first user gesture (iOS / Chrome autoplay
    // policy). Once unlocked, replay the desired track if needed.
    const unlock = () => {
      unlockedRef.current = true;
      const a = audioRef.current;
      if (!a || !enabledRef.current) return;
      const want = desiredSrcRef.current;
      if (want && a.src && a.paused) {
        a.play().catch(() => undefined);
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror enabled state for the unlock handler.
  useEffect(() => {
    enabledRef.current = opts.enabled;
  }, [opts.enabled]);

  // Apply volume changes.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, opts.volume / 100));
  }, [opts.volume]);

  // Swap track / enable / disable.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    desiredSrcRef.current = src;

    if (!opts.enabled || !src) {
      audio.pause();
      return;
    }

    if (currentSrcRef.current !== src) {
      currentSrcRef.current = src;
      try {
        audio.src = src;
        audio.load();
      } catch {
        return;
      }
    }
    // Try to play. May reject (missing file, autoplay block) — silently ignore.
    audio.play().catch(() => undefined);
  }, [src, opts.enabled]);
}

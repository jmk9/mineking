/**
 * Tiny SFX driver. One global AudioContext, one decoded AudioBuffer per
 * clip. Calls overlap freely (each `sfxPlay` spawns a fresh BufferSource),
 * so rapid clicks don't cut each other off the way HTMLAudioElement would.
 *
 * iOS Safari blocks audio until a user gesture — `sfxInit()` is meant to
 * be called from the first pointerdown/keydown so we resume the context
 * and start loading. Missing files are silent; the rest of the catalog
 * still plays.
 */

const SFX_FILES = {
  reveal: '/audio/sfx/reveal.mp3',
  flag: '/audio/sfx/flag.mp3',
  unflag: '/audio/sfx/unflag.mp3',
  chord: '/audio/sfx/chord.mp3',
  boom: '/audio/sfx/boom.mp3',
  win: '/audio/sfx/win.mp3',
  lose: '/audio/sfx/lose.mp3',
  coin: '/audio/sfx/coin.mp3',
  'hp-down': '/audio/sfx/hp-down.mp3',
} as const;

export type SfxName = keyof typeof SFX_FILES;

let ctx: AudioContext | null = null;
const buffers: Partial<Record<SfxName, AudioBuffer>> = {};
let enabled = true;
/** Linear gain, 0..1. */
let volume = 0.6;
let loading = false;
let loaded = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

async function loadAll(c: AudioContext): Promise<void> {
  if (loaded || loading) return;
  loading = true;
  await Promise.all(
    (Object.entries(SFX_FILES) as Array<[SfxName, string]>).map(async ([name, url]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const ab = await res.arrayBuffer();
        // Older Safari uses the callback signature for decodeAudioData.
        const buf = await new Promise<AudioBuffer>((resolve, reject) => {
          const p = c.decodeAudioData(ab, resolve, reject);
          if (p && typeof (p as Promise<AudioBuffer>).then === 'function') {
            (p as Promise<AudioBuffer>).then(resolve, reject);
          }
        });
        buffers[name] = buf;
      } catch {
        // Skip the missing/broken clip; the others still work.
      }
    }),
  );
  loaded = true;
  loading = false;
}

export function sfxSetEnabled(v: boolean): void {
  enabled = v;
}

/** Accepts 0..100; clamps and converts to 0..1. */
export function sfxSetVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v / 100));
}

/**
 * Unlock + start loading. Safe to call repeatedly; the first call kicks off
 * decoding, later ones just resume a suspended context.
 */
export function sfxInit(): void {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => undefined);
  if (!loaded && !loading) loadAll(c);
}

export function sfxPlay(name: SfxName): void {
  if (!enabled) return;
  const c = ctx;
  if (!c) return;
  const buf = buffers[name];
  if (!buf) return;
  if (c.state === 'suspended') c.resume().catch(() => undefined);
  try {
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(c.destination);
    src.start();
  } catch {
    // Source/start can throw if the context is closed mid-play; just drop it.
  }
}

import { supabase } from './supabase';

/** All localStorage keys that make up a player's save. */
const SAVE_KEYS = [
  'ms_coins_v1',
  'ms_theme_v1',
  'ms_custom_themes_v1',
  'ms_unlocked_themes_v1',
  'ms_progress_v1',
  'ms_dungeon_run_v1',
];

export type SaveBlob = Record<string, string>;

/** Read the current save from localStorage into a plain object. */
export function collectSave(): SaveBlob {
  const blob: SaveBlob = {};
  for (const k of SAVE_KEYS) {
    const v = localStorage.getItem(k);
    if (v != null) blob[k] = v;
  }
  return blob;
}

/** Write a save blob back into localStorage (replacing those keys). */
export function applySave(blob: SaveBlob): void {
  for (const k of SAVE_KEYS) {
    if (blob[k] != null) localStorage.setItem(k, blob[k]);
    else localStorage.removeItem(k);
  }
}

export function clearLocalSave(): void {
  for (const k of SAVE_KEYS) localStorage.removeItem(k);
}

export function saveSignature(): string {
  return JSON.stringify(collectSave());
}

/** Fetch the cloud save for a user, or null if none / on error. */
export async function pullCloud(userId: string): Promise<SaveBlob | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('data').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return (data.data as SaveBlob) ?? null;
}

/** Upsert the current save to the cloud. Returns true on success. */
export async function pushCloud(userId: string, blob: SaveBlob): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, data: blob, updated_at: new Date().toISOString() });
  if (error) {
    console.warn('cloud save failed:', error.message);
    return false;
  }
  return true;
}

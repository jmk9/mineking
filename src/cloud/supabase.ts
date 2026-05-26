import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null when Supabase isn't configured — the app then runs local-only. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const cloudEnabled = supabase != null;

/** Users type a plain username; we map it to a synthetic email for Supabase. */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@msweeper.local`;
}

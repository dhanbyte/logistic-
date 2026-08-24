import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./constants";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

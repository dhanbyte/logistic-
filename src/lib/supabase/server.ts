import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./constants";

export async function createClient() {
  try {
    const store = await cookies();
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => store.getAll(),
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {}
        },
      },
    });
  } catch {
    return null;
  }
}

export function createServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** @deprecated Do not use FALLBACK_USER_ID — it bypasses authentication. Kept only for reference. */
export const FALLBACK_USER_ID = "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5";

export async function getEffectiveSession() {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return null;
  }

  const client = await createClient();
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user) {
      return { supabase: client, user, isFallback: false };
    }
  }

  // No valid session — return null so callers enforce authentication properly.
  // Removed fallback service-client shortcut which was causing data isolation issues.
  return null;
}

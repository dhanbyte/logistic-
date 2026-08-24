import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  try {
    const store = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createServerClient<Database>(url, key, {
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const FALLBACK_USER_ID = "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5";

export async function getEffectiveSession() {
  const client = await createClient();
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user) {
      return { supabase: client, user, isFallback: false };
    }
  }

  // Fallback to service client with primary workspace user
  const serviceClient = createServiceClient();
  if (serviceClient) {
    return {
      supabase: serviceClient as any,
      user: { id: FALLBACK_USER_ID, email: "dhananjay.win2004@gmail.com" },
      isFallback: true,
    };
  }

  return null;
}

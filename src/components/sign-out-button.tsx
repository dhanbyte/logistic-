"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({
  isDemo = false,
  className,
  children,
}: {
  isDemo?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSignOut() {
    setLoggingOut(true);

    // 1. Clear all demo & session cookies
    document.cookie = "shipwave_demo=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // 2. Sign out from Supabase client
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {}

    // 3. Fast hard reload to login
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loggingOut}
      className={
        className ||
        "ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
      }
    >
      {loggingOut ? "Signing out…" : children || (isDemo ? "Exit Demo" : "Sign out")}
    </button>
  );
}

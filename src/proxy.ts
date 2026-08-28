import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/constants";

export async function proxy(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isDemoSession = request.cookies.get("shipwave_demo")?.value === "true";

  // Allow all API and webhook requests
  if (path.startsWith("/api")) {
    return response;
  }

  const guestOnly =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password");
  const authFlow = path.startsWith("/auth/callback") || path.startsWith("/reset-password");
  const publicPages =
    path === "/" ||
    guestOnly ||
    path.startsWith("/track") ||
    path.startsWith("/blog");

  // If neither logged in nor in demo mode, redirect to /login for protected app routes
  if (!user && !isDemoSession && !publicPages && !authFlow) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.searchParams.set("next", path);
    return NextResponse.redirect(target);
  }

  // If logged in via Supabase and trying to access login/register, redirect to admin (if Super Admin) or dashboard
  if (user && guestOnly) {
    const isSuperAdmin = user.email === "dhananjay.win2004@gmail.com";
    const defaultDestination = isSuperAdmin ? "/admin" : "/dashboard";
    const nextPath = request.nextUrl.searchParams.get("next") || defaultDestination;
    const target = request.nextUrl.clone();
    target.pathname = nextPath;
    target.searchParams.delete("next");
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

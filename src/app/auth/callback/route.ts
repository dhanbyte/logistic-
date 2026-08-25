import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const validationOrigin = "https://freightflow.invalid";

export function safeDestination(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) {
      return "/dashboard";
    }

    const destination = new URL(value, validationOrigin);
    return destination.origin === validationOrigin
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { location: path } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");
  let destination = safeDestination(rawNext);

  if (!code) {
    return redirectTo("/login?error=missing_callback_code");
  }

  const supabase = await createClient();
  if (!supabase) {
    return redirectTo("/dashboard");
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    return redirectTo("/login?error=invalid_callback");
  }

  const user = data.user;
  const userEmail = user.email || "";

  // If super admin logged in via Google OAuth, send to admin if no explicit destination was set
  if (userEmail === "dhananjay.win2004@gmail.com" && (!rawNext || rawNext === "/dashboard")) {
    destination = "/admin";
  }

  // Ensure seller profile and warehouse exist for this user
  try {
    const serviceClient = createServiceClient();
    if (serviceClient) {
      const { data: existingProfile } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const metadata = user.user_metadata || {};
        const fullName = metadata.full_name || metadata.name || userEmail.split("@")[0] || "Seller";
        const companyName = metadata.company_name || `${fullName}'s Store`;

        await serviceClient.from("profiles").upsert({
          id: user.id,
          email: userEmail,
          full_name: fullName,
          company_name: companyName,
          phone: metadata.phone || "9876543210",
          wallet_balance: 0,
          kyc_status: "VERIFIED",
          updated_at: new Date().toISOString(),
        });

        await serviceClient.from("warehouses").insert({
          user_id: user.id,
          warehouse_name: `${companyName} Hub`,
          contact_person: fullName,
          contact_phone: metadata.phone || "9876543210",
          address_line1: "Primary Hub Center",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110020",
          is_default: true,
          is_active: true,
        });
      }
    }
  } catch (provisionErr) {
    console.error("[AuthCallback] Auto-provision warning:", provisionErr);
  }

  return redirectTo(destination);
}

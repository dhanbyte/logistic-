import { AppShell } from "@/components/app-shell";
import { getEffectiveSession } from "@/lib/supabase/server";
import { getWalletSummary } from "@/lib/data/wallet";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getEffectiveSession();

  let fullName = "Seller";
  let email = "seller@shipwave.in";

  if (session) {
    const { user, supabase } = session;
    email = user.email || "seller@shipwave.in";

    fullName = user.email?.split("@")[0] || "Seller";

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) {
        fullName = profile.full_name;
      }
    } catch (err) {
      console.warn("[ProtectedLayout.profile]", err);
    }
  }

  // Unified single source of truth for wallet balance
  const walletSummary = await getWalletSummary();

  return (
    <AppShell
      fullName={fullName}
      email={email}
      walletBalance={walletSummary.availableBalance}
      isDemo={false}
    >
      {children}
    </AppShell>
  );
}

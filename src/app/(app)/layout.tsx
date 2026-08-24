import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <AppShell
        fullName="ShopWave Seller"
        email="seller@shopwave.in"
        walletBalance={0}
        isDemo={false}
      >
        {children}
      </AppShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName = user?.email?.split("@")[0] ?? "Seller";
  let walletBalance = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, wallet_balance")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.full_name) fullName = profile.full_name;
    if (typeof profile?.wallet_balance === "number") walletBalance = profile.wallet_balance;
  }

  return (
    <AppShell
      fullName={fullName}
      email={user?.email ?? ""}
      walletBalance={walletBalance}
      isDemo={false}
    >
      {children}
    </AppShell>
  );
}

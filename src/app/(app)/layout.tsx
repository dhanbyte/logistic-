import { AppShell } from "@/components/app-shell";
import { getEffectiveSession } from "@/lib/supabase/server";
import { computeAvailableFunds, getOrCreateWallet } from "@/lib/finance/wallet-service";
import { toRupees } from "@/lib/finance/money";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getEffectiveSession();

  let fullName = "Seller";
  let email = "seller@shopwave.in";
  let walletBalance = 5000;

  if (session) {
    const { user, supabase } = session;
    email = user.email || "seller@shopwave.in";
    fullName = user.email?.split("@")[0] || "Seller";

    try {
      const [profileRes, walletAccount] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, wallet_balance")
          .eq("id", user.id)
          .maybeSingle(),
        getOrCreateWallet(user.id),
      ]);

      if (profileRes.data?.full_name) {
        fullName = profileRes.data.full_name;
      }

      const computed = computeAvailableFunds(walletAccount);
      const computedBal = toRupees(computed.availableCashPaise + computed.freeCreditPaise);

      if (typeof profileRes.data?.wallet_balance === "number" && profileRes.data.wallet_balance > 0) {
        walletBalance = profileRes.data.wallet_balance;
      } else {
        walletBalance = computedBal;
      }
    } catch (err) {
      console.warn("[ProtectedLayout.balance]", err);
    }
  }

  return (
    <AppShell
      fullName={fullName}
      email={email}
      walletBalance={walletBalance}
      isDemo={false}
    >
      {children}
    </AppShell>
  );
}

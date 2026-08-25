import { UserCodDashboard } from "@/components/cod/user-cod-dashboard";
import { getMerchantCodBatches } from "@/lib/finance/cod-service";
import { getEffectiveSession } from "@/lib/supabase/server";

export default async function CodPage() {
  const session = await getEffectiveSession();
  const userId = session?.user?.id || "";

  const data = await getMerchantCodBatches(userId);

  return (
    <UserCodDashboard
      batches={data.batches}
      allOrders={data.allOrders}
      bankDetails={data.bankDetails}
      summary={data.summary}
    />
  );
}

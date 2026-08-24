import { AdminCodSettlementManager } from "@/components/admin/finance/admin-cod-settlement-manager";
import { getAdminCodBatches } from "@/lib/finance/cod-service";

export default async function AdminCodSettlementsPage() {
  const { batches, kpis } = await getAdminCodBatches();

  return <AdminCodSettlementManager batches={batches} kpis={kpis} />;
}

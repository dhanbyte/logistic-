import Link from "next/link";
import { Activity, Scale } from "lucide-react";
import { getAdminCouriers } from "@/lib/data/admin/couriers";
import { AdminCouriersClient } from "@/components/admin/admin-couriers-client";

export default async function AdminCouriersPage() {
  const couriers = await getAdminCouriers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Courier Partner Gateways</h1>
          <p className="text-xs text-slate-500">
            Monitor API endpoints, rate limits, live pings, and delivery success metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/couriers/api"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
          >
            <Activity size={15} className="text-indigo-600" />
            <span>API Logs &amp; Webhooks</span>
          </Link>
          <Link
            href="/admin/couriers/rates"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
          >
            <Scale size={15} />
            <span>Rate Slabs &amp; Margins</span>
          </Link>
        </div>
      </div>

      <AdminCouriersClient couriers={couriers} />
    </div>
  );
}

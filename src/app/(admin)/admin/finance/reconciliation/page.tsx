import { AlertTriangle, CheckCircle2, IndianRupee, RotateCcw, Scale, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";

export default async function AdminReconciliationPage() {
  const session = await getEffectiveSession();
  const supabase = createServiceClient() || session?.supabase;

  let disputes: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("ecommerce_shipments")
      .select("*, order:orders(*), courier_provider:courier_providers(*)")
      .gt("volumetric_weight_kg", 0)
      .order("created_at", { ascending: false });

    disputes = (data || []).filter((s: any) => Number(s.chargeable_weight_kg) > Number(s.weight_kg)).map((d: any) => ({
      id: `rec-${d.id.slice(0, 8)}`,
      awbNumber: d.awb_number,
      seller: d.order?.customer_name || "Merchant",
      courier: d.courier_provider?.name || "Courier Partner",
      declaredWeight: `${Number(d.weight_kg || 0).toFixed(2)} kg`,
      courierAuditedWeight: `${Number(d.chargeable_weight_kg || d.volumetric_weight_kg || 0).toFixed(2)} kg`,
      extraChargeClaimed: Math.max(0, Number(d.shipping_charge || 0) - Number(d.courier_charge || 0)),
      status: "RECONCILED",
      date: d.created_at ? d.created_at.slice(0, 10) : "Today",
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Discrepancy &amp; Weight Reconciliation Engine</h1>
        <p className="text-xs text-slate-500">
          Automated comparison of courier scanned weight vs merchant declared weight, slab upgrades, and auto-disputes.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">AWB &amp; Date</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">Courier Partner</th>
              <th className="py-3 px-4">Merchant Declared</th>
              <th className="py-3 px-4">Courier Audited</th>
              <th className="py-3 px-4">Discrepancy Charge</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {disputes.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-slate-900">{d.awbNumber}</p>
                  <p className="text-[11px] text-slate-400">{d.date}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{d.seller}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{d.courier}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-700">{d.declaredWeight}</td>
                <td className="py-3 px-4 font-mono font-bold text-rose-700">{d.courierAuditedWeight}</td>
                <td className="py-3 px-4 font-black text-rose-700">+{formatINR(d.extraChargeClaimed)}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                    {d.status.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            ))}
            {!disputes.length && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Scale size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No Weight Discrepancies</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All merchant declared weights perfectly match courier audited weights. 0 dispute fees.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

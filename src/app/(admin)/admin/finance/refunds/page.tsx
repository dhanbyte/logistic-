import { CheckCircle2, RotateCcw, Search } from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";

export default async function AdminRefundsPage() {
  const session = await getEffectiveSession();
  const supabase = createServiceClient() || session?.supabase;

  let refunds: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("wallet_transactions")
      .select("*, profile:profiles(*)")
      .in("category", ["REFUND", "SHIPPING_REVERSAL", "CANCELLATION_REFUND"])
      .order("created_at", { ascending: false });

    refunds = (data || []).map((t: any) => ({
      id: `ref-${t.id.slice(0, 8)}`,
      userId: t.user_id,
      userName: t.profile?.full_name || t.profile?.company_name || "Merchant",
      type: t.category || "REFUND",
      awbNumber: t.reference_id || t.awb_number || "—",
      refundAmount: Number(t.amount || 0),
      reason: t.description || "Shipment cancellation freight refund credited to wallet.",
      processedAt: t.created_at ? t.created_at.slice(0, 16).replace("T", " ") : "Today",
      status: "COMPLETED",
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Refunds &amp; Freight Reversals</h1>
        <p className="text-xs text-slate-500">
          Manage cancelled labels, voided courier AWBs and automated wallet credit reversals.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Refund ID &amp; Time</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">Type &amp; AWB</th>
              <th className="py-3 px-4">Refund Reason</th>
              <th className="py-3 px-4">Amount Recredited</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {refunds.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-slate-900">{r.id}</p>
                  <p className="text-[11px] text-slate-400">{r.processedAt}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{r.userName}</td>
                <td className="py-3 px-4">
                  <span className="rounded bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 text-[10px]">
                    {r.type.replace(/_/g, " ")}
                  </span>
                  <p className="font-mono font-bold text-indigo-700 mt-0.5">{r.awbNumber}</p>
                </td>
                <td className="py-3 px-4 font-medium text-slate-700">{r.reason}</td>
                <td className="py-3 px-4 font-black text-emerald-700">+{formatINR(r.refundAmount)}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {!refunds.length && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <RotateCcw size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No Refunds Processed</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No freight cancellations or refunds have been recorded yet.
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

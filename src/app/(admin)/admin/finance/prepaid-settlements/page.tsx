import { CheckCircle2, CreditCard, IndianRupee, RotateCcw, Search } from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";

export default async function AdminPrepaidSettlementsPage() {
  const session = await getEffectiveSession();
  const supabase = createServiceClient() || session?.supabase;

  let prepaidSettlements: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("ecommerce_shipments")
      .select("*, order:orders(*), profile:profiles(*)")
      .eq("payment_mode", "PREPAID")
      .order("created_at", { ascending: false });

    prepaidSettlements = (data || []).map((s: any) => {
      const prepaidAmt = Number(s.declared_value || 0);
      const freight = Number(s.shipping_charge || 0);
      return {
        id: `set-pre-${s.id.slice(0, 8)}`,
        userId: s.user_id,
        userName: s.profile?.full_name || s.profile?.company_name || s.order?.customer_name || "Merchant",
        orderNumber: s.order?.order_number || "ORD-PRE",
        awbNumber: s.awb_number,
        prepaidAmount: prepaidAmt,
        shippingChargeDeducted: freight,
        netSettledToWallet: Math.max(0, prepaidAmt - freight),
        date: s.created_at ? s.created_at.slice(0, 10) : "Today",
        status: s.shipment_status === "DELIVERED" ? "SETTLED" : "ACTIVE",
      };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Prepaid Settlements &amp; Auto-Credits</h1>
        <p className="text-xs text-slate-500">
          Accounting for upfront merchant prepaid transactions and freight charge settlement.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Settlement ID &amp; Date</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">AWB &amp; Order</th>
              <th className="py-3 px-4">Customer Prepaid</th>
              <th className="py-3 px-4">Shipping Freight Deducted</th>
              <th className="py-3 px-4">Net Merchant Value</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {prepaidSettlements.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-slate-900">{s.id}</p>
                  <p className="text-[11px] text-slate-400">{s.date}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{s.userName}</td>
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-indigo-700">{s.awbNumber}</p>
                  <p className="text-[11px] text-slate-400">{s.orderNumber}</p>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">{formatINR(s.prepaidAmount)}</td>
                <td className="py-3 px-4 text-rose-700 font-medium">−{formatINR(s.shippingChargeDeducted)}</td>
                <td className="py-3 px-4 font-black text-emerald-700">{formatINR(s.netSettledToWallet)}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {!prepaidSettlements.length && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RotateCcw size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No Prepaid Settlements</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No prepaid shipments found in database.
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

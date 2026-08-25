import Link from "next/link";
import { Package, RotateCcw, Truck } from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";

export default async function AdminRtoPage() {
  const session = await getEffectiveSession();
  const supabase = createServiceClient() || session?.supabase;

  let rtoShipments: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("ecommerce_shipments")
      .select("*, order:orders(*), courier_provider:courier_providers(*)")
      .in("shipment_status", ["RTO_INITIATED", "RTO_DELIVERED", "RTO_IN_TRANSIT"])
      .order("created_at", { ascending: false });

    rtoShipments = (data || []).map((s: any) => ({
      id: s.id,
      awbNumber: s.awb_number,
      orderNumber: s.order?.order_number || "ORD",
      seller: s.order?.customer_name || "Merchant",
      courier: s.courier_provider?.name || "Courier",
      rtoReason: s.notes || "Customer unavailable / Rejected at delivery",
      originCity: s.delivery_pincode || "Delivery",
      destinationCity: s.pickup_pincode || "Warehouse",
      rtoCharges: Number(s.shipping_charge || 0),
      rtoStatus: s.shipment_status,
      initiatedDate: s.created_at?.slice(0, 10) || "Today",
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">RTO (Return to Origin) Dashboard</h1>
        <p className="text-xs text-slate-500">
          Track returning undelivered parcels, return freight billing, and warehouse re-stocking.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">AWB &amp; Order</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">Courier &amp; Route</th>
              <th className="py-3 px-4">RTO Reason</th>
              <th className="py-3 px-4">RTO Freight Fee</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {rtoShipments.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-sm text-orange-700">{r.awbNumber}</p>
                  <p className="text-[11px] text-slate-400">{r.orderNumber}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{r.seller}</td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-900">{r.courier}</p>
                  <p className="text-[11px] text-slate-500">{r.destinationCity} &rarr; {r.originCity}</p>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">{r.rtoReason}</td>
                <td className="py-3 px-4 font-bold text-rose-700">{formatINR(r.rtoCharges)}</td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-orange-100 text-orange-800 px-2 py-0.5 text-[10px] font-bold">
                    {r.rtoStatus.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/shipments/${r.id}`}
                    target="_blank"
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Track Return
                  </Link>
                </td>
              </tr>
            ))}
            {!rtoShipments.length && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RotateCcw size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No RTO Shipments</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No undelivered parcels returning to origin currently. All shipments are active or delivered.
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

import { CheckCircle2, RotateCcw, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatINR } from "@/lib/calculations";
import { getRtoShipments } from "@/lib/data/ecommerce-shipments";

export default async function RtoPage() {
  const rtoShipments = await getRtoShipments();

  return (
    <>
      <PageHeader
        title="RTO (Return to Origin) Tracking"
        description="Track parcels returning to your warehouse due to customer rejections or multiple delivery failures."
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">RTO AWB #</th>
              <th className="py-3 px-4">Original Order</th>
              <th className="py-3 px-4">Return Reason</th>
              <th className="py-3 px-4">RTO Surcharge</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Initiated At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {rtoShipments.map((rto) => (
              <tr key={rto.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-bold text-sm text-orange-700">{rto.rtoAwbNumber}</p>
                  <p className="text-[11px] text-slate-400">Ekart Reverse Network</p>
                </td>

                <td className="py-3 px-4 font-semibold text-slate-900">
                  Order SW-84915
                </td>

                <td className="py-3 px-4">
                  <p className="font-medium text-slate-800">{rto.reason}</p>
                </td>

                <td className="py-3 px-4 font-bold text-rose-600">
                  {formatINR(rto.rtoShippingCharge)}
                </td>

                <td className="py-3 px-4">
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                    {rto.rtoStatus.replace(/_/g, " ")}
                  </span>
                </td>

                <td className="py-3 px-4 text-right text-slate-500">
                  {new Date(rto.initiatedAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

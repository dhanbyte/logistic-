import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Printer,
  RotateCcw,
  Search,
  Truck,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getEcommerceShipments } from "@/lib/data/ecommerce-shipments";

export default async function AdminShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const { shipments, total } = await getEcommerceShipments({
    pageSize: 50,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">All Courier Shipments &amp; AWBs</h1>
          <p className="text-xs text-slate-500">
            Live tracking and carrier movements across Shadowfax, Xpressbees, and Delhivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/shipments/ndr"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 shadow-xs flex items-center gap-1.5"
          >
            <AlertTriangle size={15} />
            <span>NDR Escalations</span>
          </Link>
          <Link
            href="/admin/shipments/rto"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 shadow-xs flex items-center gap-1.5"
          >
            <RotateCcw size={15} />
            <span>RTO In-Transit</span>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">AWB &amp; Order</th>
              <th className="py-3 px-4">Courier Partner</th>
              <th className="py-3 px-4">Route (PIN &rarr; PIN)</th>
              <th className="py-3 px-4">Weight &amp; Specs</th>
              <th className="py-3 px-4">Freight Charge</th>
              <th className="py-3 px-4">Current Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {shipments.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-sm text-indigo-600">{s.awbNumber}</p>
                  <p className="text-[11px] text-slate-400">{s.order?.orderNumber || "ORD-001"}</p>
                </td>

                <td className="py-3 px-4">
                  <span className="font-bold text-slate-900">
                    {s.courierProvider?.name || (s.awbNumber.startsWith("SF") ? "Shadowfax" : "Xpressbees")}
                  </span>
                </td>

                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-800">
                    {s.pickupPincode} &rarr; <strong className="text-slate-900">{s.deliveryPincode}</strong>
                  </p>
                </td>

                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-900">{s.weightKg} kg</p>
                  <p className="text-[11px] text-slate-400">
                    {s.lengthCm}x{s.widthCm}x{s.heightCm} cm
                  </p>
                </td>

                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{formatINR(s.totalShippingCharge)}</p>
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      s.shipmentStatus === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : s.shipmentStatus === "IN_TRANSIT"
                          ? "bg-blue-100 text-blue-800"
                          : s.shipmentStatus === "NDR"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {s.shipmentStatus.replace(/_/g, " ")}
                  </span>
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/shipments/${s.id}`}
                      target="_blank"
                      className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      Track
                    </Link>
                    {s.labelUrl && (
                      <a
                        href={s.labelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100"
                        title="Print 4x6 Label"
                      >
                        <Printer size={13} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

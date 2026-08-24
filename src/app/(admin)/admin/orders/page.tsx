import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  MapPin,
  Package,
  RotateCcw,
  Search,
  Truck,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getOrders } from "@/lib/data/orders";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const params = await searchParams;
  const { orders, total } = await getOrders({ pageSize: 50, q: params.q });

  const filteredOrders = params.type
    ? orders.filter((o) => o.paymentMode === params.type)
    : orders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Global Orders Pipeline</h1>
          <p className="text-xs text-slate-500">
            Real-time inspection of all seller orders across Prepaid &amp; Cash on Delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              !params.type
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            All Orders ({total})
          </Link>
          <Link
            href="/admin/orders?type=PREPAID"
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              params.type === "PREPAID"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Prepaid
          </Link>
          <Link
            href="/admin/orders?type=COD"
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              params.type === "COD"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Cash on Delivery (COD)
          </Link>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Order ID &amp; Date</th>
                <th className="py-3 px-4">Seller / Store</th>
                <th className="py-3 px-4">Customer &amp; Route</th>
                <th className="py-3 px-4">Product &amp; Weight</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status &amp; AWB</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <p className="font-bold font-mono text-sm text-indigo-600">{o.orderNumber}</p>
                    <p className="text-[11px] text-slate-400">{o.createdAt.slice(0, 10)}</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">Dhanbyte Logistics</p>
                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                      {o.channelName}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{o.customer?.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      {o.customer?.city} &rarr; <strong>PIN: {o.customer?.pincode}</strong>
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800 line-clamp-1">
                      {o.items?.[0]?.productName || "E-Commerce Goods"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {o.totalWeightKg} kg &bull; Qty: {o.items?.[0]?.quantity || 1}
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{formatINR(o.orderAmount)}</p>
                    <span
                      className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-bold ${
                        o.paymentMode === "COD"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {o.paymentMode}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        o.orderStatus === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : o.orderStatus === "OUT_FOR_DELIVERY"
                            ? "bg-blue-100 text-blue-800"
                            : o.orderStatus === "IN_TRANSIT"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {o.orderStatus.replace(/_/g, " ")}
                    </span>
                    {o.shipment?.awbNumber && (
                      <p className="font-mono text-[10px] text-indigo-600 font-bold mt-0.5">
                        {o.shipment.awbNumber}
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/shipments`}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1"
                    >
                      <Eye size={13} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

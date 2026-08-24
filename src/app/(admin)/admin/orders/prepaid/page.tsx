import Link from "next/link";
import { CreditCard, Eye, Package, Search } from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getOrders } from "@/lib/data/orders";

export default async function AdminPrepaidOrdersPage() {
  const { orders } = await getOrders({ pageSize: 50 });
  const prepaidOrders = orders.filter((o) => o.paymentMode === "PREPAID");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Prepaid Orders Management</h1>
          <p className="text-xs text-slate-500">
            All merchant orders with online upfront customer payments.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Order ID &amp; Date</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">Consignee &amp; PIN</th>
              <th className="py-3 px-4">Product &amp; Weight</th>
              <th className="py-3 px-4">Order Value</th>
              <th className="py-3 px-4">Status &amp; AWB</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {prepaidOrders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{o.orderNumber}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">Dhanbyte Logistics</td>
                <td className="py-3 px-4">{o.customer?.fullName} (PIN: {o.customer?.pincode})</td>
                <td className="py-3 px-4">{o.items?.[0]?.productName || "Product"} ({o.totalWeightKg} kg)</td>
                <td className="py-3 px-4 font-bold text-slate-900">{formatINR(o.orderAmount)}</td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    {o.orderStatus.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/shipments`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

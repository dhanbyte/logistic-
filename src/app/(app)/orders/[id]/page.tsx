import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Package,
  Printer,
  Truck,
  User,
} from "lucide-react";
import { CloneOrderButton } from "@/components/orders/clone-order-button";
import { PageHeader } from "@/components/page-header";
import { buttonClassName } from "@/components/ui/button";
import { formatINR } from "@/lib/calculations";
import { getOrderById } from "@/lib/data/orders";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
      </div>

      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Channel: ${order.channelName} &bull; Created on ${order.createdAt.slice(0, 10)}`}
      >
        <div className="flex items-center gap-2">
          <CloneOrderButton orderId={order.id} orderNumber={order.orderNumber} />
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              order.orderStatus === "DELIVERED"
                ? "bg-emerald-100 text-emerald-800"
                : order.orderStatus === "OUT_FOR_DELIVERY"
                  ? "bg-blue-100 text-blue-800"
                  : order.orderStatus === "NDR"
                    ? "bg-rose-100 text-rose-800"
                    : order.orderStatus === "CANCELLED"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
            }`}
          >
            {order.orderStatus.replace(/_/g, " ")}
          </span>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Package size={16} className="text-indigo-600" /> Ordered Line Items
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-medium">{item.productName}</td>
                    <td className="py-3 text-slate-500">{item.sku || "N/A"}</td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3 text-right">{formatINR(item.unitPrice)}</td>
                    <td className="py-3 text-right font-bold">{formatINR(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Total Invoice Amount:</span>
              <span>{formatINR(order.orderAmount)}</span>
            </div>
          </div>

          {/* Delivery & Pickup Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <User size={14} className="text-indigo-600" /> Buyer Details
              </h4>
              <p className="font-bold text-sm text-slate-900">{order.customer?.fullName}</p>
              <p className="text-xs text-slate-600 mt-1">{order.customer?.addressLine1}</p>
              {order.customer?.addressLine2 && (
                <p className="text-xs text-slate-500">{order.customer?.addressLine2}</p>
              )}
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}
              </p>
              <p className="text-xs text-slate-500 mt-2">Phone: {order.customer?.phone}</p>
              {order.customer?.email && (
                <p className="text-xs text-slate-500">Email: {order.customer?.email}</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Building2 size={14} className="text-indigo-600" /> Origin Warehouse
              </h4>
              <p className="font-bold text-sm text-slate-900">{order.warehouse?.warehouseName}</p>
              <p className="text-xs text-slate-600 mt-1">{order.warehouse?.addressLine1}</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {order.warehouse?.city}, {order.warehouse?.state} - {order.warehouse?.pincode}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Contact: {order.warehouse?.contactPerson} ({order.warehouse?.contactPhone})
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Logistics & Payment Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Truck size={16} className="text-indigo-600" /> Package & Payment
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span
                  className={`font-bold rounded-md px-1.5 py-0.5 text-[10px] ${
                    order.paymentMode === "COD"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {order.paymentMode}
                </span>
              </div>

              {order.paymentMode === "COD" && (
                <div className="flex justify-between">
                  <span className="text-slate-500">COD Collectible:</span>
                  <span className="font-bold text-slate-800">{formatINR(order.codAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-500">Dead Weight:</span>
                <span className="font-semibold text-slate-800">{order.totalWeightKg} kg</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Dimensions:</span>
                <span className="font-semibold text-slate-800">
                  {order.lengthCm} &times; {order.widthCm} &times; {order.heightCm} cm
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Volumetric Weight:</span>
                <span className="font-semibold text-slate-800">{order.volumetricWeightKg} kg</span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="font-bold text-indigo-900">Chargeable Weight:</span>
                <span className="font-extrabold text-indigo-700">
                  {order.chargeableWeightKg} kg
                </span>
              </div>
            </div>

            {order.invoiceNumber && (
              <div className="border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">Tax Invoice:</span>
                <p className="font-semibold text-slate-800">{order.invoiceNumber}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

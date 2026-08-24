import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Package,
  Plus,
  Truck,
  Upload,
  Wallet,
} from "lucide-react";
import { DeliveryRatioGauges } from "@/components/dashboard/delivery-ratio-gauges";
import { EcommerceKpiGrid } from "@/components/dashboard/ecommerce-kpi-grid";
import { ShippingRateCalculator } from "@/components/dashboard/shipping-rate-calculator";
import { PageHeader } from "@/components/page-header";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations";
import { getDashboardKpis, getEcommerceShipments } from "@/lib/data/ecommerce-shipments";
import { getOrders } from "@/lib/data/orders";

export default async function DashboardPage() {
  const [kpis, ordersResult, shipmentsResult] = await Promise.all([
    getDashboardKpis(),
    getOrders({ pageSize: 5 }),
    getEcommerceShipments({ pageSize: 5 }),
  ]);

  return (
    <>
      <PageHeader
        title="Seller Shipping Hub"
        description="Monitor live fulfillment, track shipments across couriers, and manage COD remittance in real-time."
      >
        <div className="flex items-center gap-2">
          <Link
            href="/orders/new"
            className={`${buttonClassName()} bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs`}
          >
            <Plus size={16} /> Create Order
          </Link>
          <Link
            href="/orders"
            className={`${buttonClassName({ variant: "outline" })} text-slate-700 hover:bg-slate-50`}
          >
            <Upload size={16} /> Bulk Upload
          </Link>
        </div>
      </PageHeader>

      {/* 10-Card Ecommerce KPI Grid */}
      <EcommerceKpiGrid kpis={kpis} />

      {/* Circular Delivery & RTO Performance Gauges */}
      <div className="mt-6">
        <DeliveryRatioGauges kpis={kpis} />
      </div>

      {/* Main Grid: Rate Calculator & Live Active Shipments */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <ShippingRateCalculator />

        {/* Live Active Shipments */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Shipments</h3>
              <p className="text-xs text-slate-500">Live parcel tracking across courier partners</p>
            </div>
            <Link
              href="/shipments"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 pt-1">
            {shipmentsResult.shipments.map((shipment) => (
              <Link
                key={shipment.id}
                href={`/shipments/${shipment.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50/80 rounded-lg px-2 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{shipment.awbNumber}</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                      {shipment.courierProvider?.name?.split(" ")[0] || "Courier"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {shipment.pickupPincode} &rarr; {shipment.deliveryPincode} ({shipment.weightKg} kg)
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      shipment.shipmentStatus === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : shipment.shipmentStatus === "OUT_FOR_DELIVERY"
                          ? "bg-blue-100 text-blue-800"
                          : shipment.shipmentStatus === "NDR"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {shipment.shipmentStatus.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {formatINR(shipment.shippingCharge)}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className="mt-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-xs text-slate-500">Latest incoming e-commerce orders</p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Manage all orders <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 pt-1">
            {ordersResult.orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-3 hover:bg-slate-50/50 rounded-lg px-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{order.orderNumber}</span>
                    <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                      {order.channelName}
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                        order.paymentMode === "COD"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {order.paymentMode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {order.customer?.fullName || "Customer"} &bull; {order.items?.[0]?.productName || "Product"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatINR(order.orderAmount)}</p>
                    <span className="text-[11px] font-medium text-slate-500">
                      {order.orderStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

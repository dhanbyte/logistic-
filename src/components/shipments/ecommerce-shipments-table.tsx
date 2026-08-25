"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  Package,
  Printer,
  RotateCcw,
  Search,
  Truck,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import type { EcommerceShipment } from "@/types";

export function EcommerceShipmentsTable({
  shipments,
  total,
  page,
  pageCount,
}: {
  shipments: EcommerceShipment[];
  total: number;
  page: number;
  pageCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const currentStatus = searchParams.get("status") || "ALL";

  function updateQuery(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery("q", searchTerm);
  }

  const tabs = [
    { key: "ALL", label: "All Shipments", icon: Package },
    { key: "MANIFESTED", label: "Manifested", icon: Clock },
    { key: "IN_TRANSIT", label: "In Transit", icon: Truck },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery (OFD)", icon: MapPin },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
    { key: "NDR", label: "NDR Exceptions", icon: AlertTriangle },
    { key: "RTO_INITIATED", label: "RTO", icon: RotateCcw },
  ];

  return (
    <div className="space-y-4">
      {/* Top Segmented Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map((tab) => {
          const isActive = currentStatus === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => updateQuery("status", tab.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={14} className={isActive ? "text-white" : "text-slate-400"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by AWB, Order Number, or PIN code…"
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Courier Filter */}
          <select
            value={searchParams.get("courier") || "ALL"}
            onChange={(e) => updateQuery("courier", e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Couriers</option>
            <option value="shadowfax">Shadowfax</option>
            <option value="xpressbees">Xpressbees</option>
            <option value="delhivery">Delhivery</option>
            <option value="bluedart">Blue Dart</option>
            <option value="ekart">Ekart</option>
            <option value="dtdc">DTDC</option>
          </select>

          {/* Payment Filter */}
          <select
            value={searchParams.get("paymentMode") || "ALL"}
            onChange={(e) => updateQuery("paymentMode", e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Payments</option>
            <option value="PREPAID">Prepaid</option>
            <option value="COD">COD</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">AWB & Tracking</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Courier</th>
                <th className="py-3 px-4">Route (PIN &rarr; PIN)</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Freight Charge</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <Link
                      href={`/shipments/${s.id}`}
                      className="font-bold text-sm text-indigo-600 hover:underline font-mono"
                    >
                      {s.awbNumber}
                    </Link>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Created {s.createdAt.slice(0, 10)}
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">
                      {s.order?.orderNumber || "Order"}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {s.order?.customer?.fullName || "Consignee"}
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">
                      {s.courierProvider?.name || (s.awbNumber.startsWith("SF") ? "Shadowfax Express" : "Xpressbees")}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      Routing: {s.routingCode || `${s.deliveryPincode.slice(0, 3)}`}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">
                      {s.pickupPincode} &rarr; {s.deliveryPincode}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Est. {s.estimatedDeliveryDate ? s.estimatedDeliveryDate.slice(0, 10) : "2-3 Days"}
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{s.chargeableWeightKg} kg</p>
                    <p className="text-[10px] text-slate-400">Dead: {s.weightKg} kg</p>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        s.paymentMode === "COD"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {s.paymentMode}
                    </span>
                    {s.paymentMode === "COD" && (
                      <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                        {formatINR(s.codAmount)}
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{formatINR(s.shippingCharge)}</p>
                    <p className="text-[10px] text-slate-400">Freight (GST Incl.)</p>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        s.shipmentStatus === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : s.shipmentStatus === "OUT_FOR_DELIVERY"
                            ? "bg-blue-100 text-blue-800"
                            : s.shipmentStatus === "NDR"
                              ? "bg-rose-100 text-rose-800"
                              : s.shipmentStatus === "RTO_INITIATED"
                                ? "bg-orange-100 text-orange-800"
                                : s.shipmentStatus === "IN_TRANSIT"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {s.shipmentStatus.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/track/${s.awbNumber}`}
                        target="_blank"
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                        title="Public Shareable Live Tracking Page"
                      >
                        <Truck size={12} /> Track
                      </Link>

                      {s.labelUrl && (
                        <a
                          href={s.labelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          title="Print Official Shipping Label"
                        >
                          <Printer size={13} />
                        </a>
                      )}

                      <Link
                        href={`/shipments/${s.id}`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        title="View Full Shipment"
                      >
                        <Eye size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {!shipments.length && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Truck className="mx-auto size-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">No shipments found in this view</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Go to Orders and click &quot;Ship Now&quot; to book your courier AWB.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} shipments
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => updateQuery("page", String(page - 1))}
                className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-medium text-slate-700">
                Page {page} of {pageCount}
              </span>
              <button
                disabled={page >= pageCount}
                onClick={() => updateQuery("page", String(page + 1))}
                className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

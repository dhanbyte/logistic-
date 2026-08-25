"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Search,
  Truck,
  X,
} from "lucide-react";
import type { WarehouseWithStats, WarehouseRealShipment } from "@/lib/data/warehouses";

export function WarehouseTrackingModal({
  warehouse,
}: {
  warehouse: WarehouseWithStats;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pickup" | "transit" | "delivered">("all");

  const hubShipments = warehouse.realShipments || [];

  const filtered = hubShipments.filter((s) => {
    const matchesSearch =
      s.awb.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === "pickup") return s.status === "READY_FOR_PICKUP";
    if (activeTab === "transit") return s.status === "IN_TRANSIT" || s.status === "OUT_FOR_DELIVERY";
    if (activeTab === "delivered") return s.status === "DELIVERED";
    return true;
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-xs cursor-pointer"
      >
        <Compass size={14} />
        <span>Track Hub Dispatches</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Building2 size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{warehouse.warehouseName}</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
                      Active Hub &bull; {warehouse.pincode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{warehouse.city}, {warehouse.state}</span>
                    <span>&bull;</span>
                    <span>Contact: {warehouse.contactPerson} ({warehouse.contactPhone})</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Real Hub Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 pb-4 border-b border-slate-100 bg-white">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Awaiting Pickup
                </span>
                <span className="text-xl font-black text-amber-600 mt-0.5 block">
                  {warehouse.awaitingPickupCount} Parcels
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Ready for rider collection</span>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  In Transit
                </span>
                <span className="text-xl font-black text-indigo-600 mt-0.5 block">
                  {warehouse.inTransitCount} Shipments
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Moving across India</span>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Delivered
                </span>
                <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                  {warehouse.deliveredCount} Orders
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Successfully completed</span>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Hub Orders
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">
                  {warehouse.totalOrdersCount} Total
                </span>
                <span className="text-[10px] text-indigo-600 font-medium">Origin fulfillment count</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-6 pt-4 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                    activeTab === "all" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  All ({hubShipments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pickup")}
                  className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                    activeTab === "pickup" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  Pending Pickup ({warehouse.awaitingPickupCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("transit")}
                  className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                    activeTab === "transit" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  In Transit ({warehouse.inTransitCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("delivered")}
                  className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                    activeTab === "delivered" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  Delivered ({warehouse.deliveredCount})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AWB, order or customer..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Real Shipment Dispatches Table */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">AWB &amp; Order</th>
                      <th className="px-4 py-3">Customer &amp; Destination</th>
                      <th className="px-4 py-3">Carrier Partner</th>
                      <th className="px-4 py-3">Status &amp; Timeline</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((item) => (
                      <tr key={item.awb} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-indigo-700 text-xs block">
                            {item.awb}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-900">
                            {item.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {item.items} &bull; {item.weight}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800 block">
                            {item.recipient}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span>{item.destination}</span>
                          </span>
                          <span className="text-[10px] font-medium text-emerald-700 block mt-0.5">
                            {item.amount}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                            <Truck size={13} className="text-indigo-600" />
                            <span>{item.courier}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${item.statusColor}`}>
                            <span className="size-1.5 rounded-full bg-current" />
                            <span>{item.statusText}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {item.timestamp}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/shipments`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <span>Live Track</span>
                            <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                          {hubShipments.length === 0
                            ? "No orders assigned to this warehouse yet. Create an order to start shipping!"
                            : "No shipments matching your search query."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <span className="text-xs text-slate-500">
                Origin Postal Hub: <strong className="text-slate-800">{warehouse.addressLine1}, {warehouse.pincode}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Link
                  href="/manifest"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                >
                  <Download size={13} />
                  <span>Download Manifest</span>
                </Link>
                <Link
                  href="/shipments"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <span>Open Full Shipments View</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import {
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  MapPin,
  Package,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { WarehouseModal } from "@/components/warehouses/warehouse-modal";
import { WarehouseTrackingModal } from "@/components/warehouses/warehouse-tracking-modal";
import { getWarehousesPageData } from "@/lib/data/warehouses";

export default async function WarehousesPage() {
  const {
    warehouses,
    totalHubs,
    totalAwaitingPickup,
    totalInTransit,
    totalDelivered,
    pickupSuccessSla,
    activeCouriers,
  } = await getWarehousesPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup Warehouses & Hubs"
        description="Manage your fulfillment locations across India and track live courier rider pickups and dispatches."
      >
        <div className="flex items-center gap-2">
          <Link
            href="/manifest"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
          >
            <FileText size={14} className="text-indigo-600" />
            <span>Pickup Manifests</span>
          </Link>
          <WarehouseModal />
        </div>
      </PageHeader>

      {/* 1. REAL WAREHOUSE PICKUP & DISPATCH TELEMETRY RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Active Hubs
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalHubs} {totalHubs === 1 ? "Location" : "Locations"}
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <CheckCircle2 size={12} /> Ready for Rider Pickup
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Ready for Pickup
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {totalAwaitingPickup} {totalAwaitingPickup === 1 ? "Parcel" : "Parcels"}
          </span>
          <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1 mt-1">
            <Clock size={12} /> {totalAwaitingPickup > 0 ? "Awaiting courier handover" : "No pending handovers"}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Dispatched In Transit
          </span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">
            {totalInTransit} {totalInTransit === 1 ? "Shipment" : "Shipments"}
          </span>
          <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 mt-1">
            <Truck size={12} /> {activeCouriers.join(" • ")}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pickup Success SLA
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {pickupSuccessSla}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
            <ShieldCheck size={12} /> {totalDelivered} Delivered Orders
          </span>
        </div>
      </div>

      {/* 2. DIRECT AWB & PICKUP TRACKING SEARCH BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass size={16} className="text-indigo-600" />
              <span>Instant Hub Shipment &amp; Pickup Tracking</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter any Waybill / AWB or order number to track parcels dispatched from your warehouses.
            </p>
          </div>

          <form action="/shipments" method="GET" className="flex items-center gap-2 w-full sm:w-80">
            <div className="relative flex-1">
              <input
                type="text"
                name="q"
                placeholder="Track AWB (e.g. SFX, XPB, DLV)..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              type="submit"
              className="h-10 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              Track
            </button>
          </form>
        </div>
      </div>

      {/* 3. REAL WAREHOUSE HUBS CARDS GRID */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((w) => (
          <div
            key={w.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs relative flex flex-col justify-between hover:border-indigo-200 transition-all"
          >
            <div>
              {/* Hub Title & Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {w.warehouseName}
                    </h3>
                    <span className="text-[10px] font-bold text-indigo-600">
                      PIN: {w.pincode}
                    </span>
                  </div>
                </div>

                {w.isDefault ? (
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 shrink-0">
                    <CheckCircle2 size={11} /> Primary Hub
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                    Secondary
                  </span>
                )}
              </div>

              {/* Address & Contact */}
              <div className="mt-3.5 space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <p className="flex items-start gap-1.5">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {w.addressLine1}
                    {w.addressLine2 ? `, ${w.addressLine2}` : ""}, {w.city}, {w.state} -{" "}
                    <strong className="text-slate-900">{w.pincode}</strong>
                  </span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-500">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span>
                    {w.contactPerson} &bull; <strong className="text-slate-700">{w.contactPhone}</strong>
                  </span>
                </p>
                {w.gstin && (
                  <p className="text-[11px] text-slate-400 font-mono">GSTIN: {w.gstin}</p>
                )}
              </div>

              {/* Real Hub Telemetry Tag */}
              <div className="mt-3 flex items-center justify-between text-[11px] px-1">
                <span className="text-slate-600 font-medium flex items-center gap-1">
                  <Package size={13} className="text-indigo-600" />
                  <span>Dispatches: <strong>{w.totalOrdersCount} orders</strong></span>
                </span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[10px]">
                  ● {w.isActive ? "Active Pickup Node" : "Inactive Node"}
                </span>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <WarehouseTrackingModal warehouse={w} />
              <WarehouseModal warehouse={w} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

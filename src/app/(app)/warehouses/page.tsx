import { Building2, CheckCircle2, MapPin, Phone, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { WarehouseModal } from "@/components/warehouses/warehouse-modal";
import { getWarehouses } from "@/lib/data/warehouses";

export default async function WarehousesPage() {
  const warehouses = await getWarehouses();

  return (
    <>
      <PageHeader
        title="Pickup Warehouses & Hubs"
        description="Manage your pickup locations across India where courier riders arrive for parcel handovers."
      >
        <WarehouseModal />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((w) => (
          <div
            key={w.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Building2 size={16} />
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {w.warehouseName}
                  </h3>
                </div>
                {w.isDefault && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Default Hub
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
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
                    {w.contactPerson} ({w.contactPhone})
                  </span>
                </p>
                {w.gstin && (
                  <p className="text-[11px] text-slate-400 font-mono">GSTIN: {w.gstin}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold ${
                  w.isActive ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                {w.isActive ? "● Active for Pickup" : "Inactive"}
              </span>
              <WarehouseModal warehouse={w} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

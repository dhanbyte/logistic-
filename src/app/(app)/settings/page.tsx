import { Building2, ShieldCheck, Warehouse as WarehouseIcon } from "lucide-react";
import { signOut } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { BankDetailsForm } from "@/components/settings/bank-details-form";
import { SellerSettingsForm } from "@/components/settings/seller-settings-form";
import { Button } from "@/components/ui/button";
import { WarehouseModal } from "@/components/warehouses/warehouse-modal";
import { getSellerAccount } from "@/lib/data/seller";
import { getWarehouses } from "@/lib/data/warehouses";
import { getUserBankDetails } from "@/lib/finance/cod-service";
import { getEffectiveSession } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const session = await getEffectiveSession();
  const userId = session ? session.user.id : undefined;

  const [seller, warehouses, bankDetails] = await Promise.all([
    getSellerAccount(),
    getWarehouses(),
    getUserBankDetails(userId),
  ]);

  return (
    <>
      <PageHeader
        title="Seller Account & Settings"
        description="Manage your registered company details, verified bank account for COD remittances, and pickup warehouse locations."
      />

      <div className="space-y-8">
        {/* 1. Seller Profile & Tax Details */}
        <SellerSettingsForm seller={seller} />

        {/* 2. COD Remittance & Payout Bank Account Details */}
        <BankDetailsForm bankDetails={bankDetails} />

        {/* 2. Warehouse Locations Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <WarehouseIcon size={18} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pickup Warehouse Locations</h3>
                <p className="text-xs text-slate-500">Origin dispatch hubs for courier pickup</p>
              </div>
            </div>
            <WarehouseModal />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {warehouses.map((w) => (
              <div
                key={w.id}
                className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{w.warehouseName}</h4>
                    {w.isDefault && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {w.addressLine1}, {w.city}, {w.state} - <strong>{w.pincode}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {w.contactPerson} ({w.contactPhone})
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                  <WarehouseModal warehouse={w} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Account Sign Out */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Sign Out of Shipwave</h4>

            <p className="text-xs text-slate-500">End your active authenticated session</p>
          </div>
          <form action={signOut}>
            <Button variant="outline" className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border-rose-200">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

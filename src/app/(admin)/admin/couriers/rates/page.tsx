"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Edit3,
  IndianRupee,
  Layers,
  Percent,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/calculations";
import { getGlobalRatesAction, saveGlobalRatesAction } from "@/app/admin-actions";

export default function AdminGlobalRatesPage() {
  const [rates, setRates] = useState<Record<string, any>>({
    shadowfax: {
      courierCode: "shadowfax",
      courierName: "Shadowfax Express 0.5KG (Air)",
      zoneA_0_500g: 27,
      zoneB_0_500g: 30,
      zoneC_0_500g: 34,
      zoneD_0_500g: 38,
      zoneE_0_500g: 46,
      zoneA_500g_1kg: 40,
      zoneB_500g_1kg: 46,
      zoneC_500g_1kg: 56,
      zoneD_500g_1kg: 62,
      zoneE_500g_1kg: 80,
      additional500g: 24,
      initialSlabWeightKg: 0.5,
      codChargeFlat: 20,
      codPercent: 0,
    },
    shadowfax_surface: {
      courierCode: "shadowfax_surface",
      courierName: "Shadowfax Cargo 5KG (Surface)",
      zoneA_0_500g: 75,
      zoneB_0_500g: 85,
      zoneC_0_500g: 89,
      zoneD_0_500g: 99,
      zoneE_0_500g: 119,
      additional500g: 20,
      additionalKg: 20,
      initialSlabWeightKg: 5.0,
      codChargeFlat: 20,
      codPercent: 0,
    },
    xpressbees: {
      courierCode: "xpressbees",
      courierName: "Xpressbees Surface (0.5kg)",
      zoneA_0_500g: 52,
      zoneB_0_500g: 62,
      zoneC_0_500g: 72,
      zoneD_0_500g: 82,
      zoneE_0_500g: 98,
      additional500g: 38,
      initialSlabWeightKg: 0.5,
      codChargeFlat: 0,
      codPercent: 0,
    },
    delhivery: {
      courierCode: "delhivery",
      courierName: "Delhivery Direct (0.5kg)",
      zoneA_0_500g: 55,
      zoneB_0_500g: 65,
      zoneC_0_500g: 75,
      zoneD_0_500g: 85,
      zoneE_0_500g: 105,
      additional500g: 40,
      initialSlabWeightKg: 0.5,
      codChargeFlat: 0,
      codPercent: 0,
    },
  });

  const [activeCourier, setActiveCourier] = useState<string>("shadowfax");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getGlobalRatesAction();
        if (res.ok && res.data) {
          setRates((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error("Failed to load global rates", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleRateChange(courierCode: string, field: string, value: number) {
    setRates((prev) => ({
      ...prev,
      [courierCode]: {
        ...prev[courierCode],
        [field]: value,
      },
    }));
  }

  async function handleSaveGlobalRates() {
    setSaving(true);
    try {
      const res = await saveGlobalRatesAction(rates);
      if (res.ok) {
        toast.success(res.message || "Global courier rates saved successfully!");
      } else {
        toast.error(res.message || "Failed to save global rates.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving global rates.");
    } finally {
      setSaving(false);
    }
  }

  const currentRate = rates[activeCourier] || rates.shadowfax;
  const isSurface = activeCourier.includes("surface");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
              Platform-Wide Pricing
            </span>
            <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span> AUTO-APPLIED TO NEW MERCHANTS
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2">
            Global Courier Rate Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure default Zone A to E pricing for Express Air & Surface Cargo. All new merchants receive these rates automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveGlobalRates}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 transition-all shrink-0"
        >
          {saving ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Save size={16} />}
          <span>Save Global Rate Card</span>
        </button>
      </div>

      {/* Courier Selector Tabs */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-200 pb-3">
        {[
          { code: "shadowfax", label: "Shadowfax Express (Air)", badge: "₹27/0.5kg Base", icon: Zap },
          { code: "shadowfax_surface", label: "Shadowfax Cargo (Surface)", badge: "Zone Rates (5KG)", icon: Truck },
          { code: "xpressbees", label: "Xpressbees Surface", badge: "0.5kg Slabs", icon: Radio },
          { code: "delhivery", label: "Delhivery Direct", badge: "0.5kg Slabs", icon: Activity },
        ].map((c) => {
          const Icon = c.icon;
          const isSel = activeCourier === c.code;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => setActiveCourier(c.code)}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isSel
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={16} className={isSel ? "text-indigo-400" : "text-slate-400"} />
              <span>{c.label}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold ${isSel ? "bg-indigo-500/30 text-indigo-200" : "bg-slate-100 text-slate-500"}`}>
                {c.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Rate Matrix Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {currentRate.courierName} — Zone Pricing Grid
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSurface
                ? "Zone-wise initial slab rate (up to 5.0 kg) + Additional kg price for heavy surface parcels."
                : "Zone-wise initial 0–500g rate + Additional 500g slab charge for express air dispatches."}
            </p>
          </div>
          <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
            {isSurface ? "Base Weight Slab: 5.00 KG" : "Base Weight Slab: 0.50 KG"}
          </span>
        </div>

        {/* 5-Zone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Zone A */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-slate-700">Zone A (Intra-City)</span>
              <span className="text-[9px] font-bold text-slate-400">Local</span>
            </div>
            <p className="text-[10px] text-slate-500">Same city pickup & delivery</p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="10"
                value={currentRate.zoneA_0_500g || 0}
                onChange={(e) => handleRateChange(activeCourier, "zoneA_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-black text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Zone B */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-slate-700">Zone B (Regional)</span>
              <span className="text-[9px] font-bold text-slate-400">Within State</span>
            </div>
            <p className="text-[10px] text-slate-500">Intra-state shipments</p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="10"
                value={currentRate.zoneB_0_500g || 0}
                onChange={(e) => handleRateChange(activeCourier, "zoneB_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-black text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Zone C */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-slate-700">Zone C (Metro)</span>
              <span className="text-[9px] font-bold text-slate-400">Metro-to-Metro</span>
            </div>
            <p className="text-[10px] text-slate-500">DEL, BOM, BLR, CCU, HYD, MAA</p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="10"
                value={currentRate.zoneC_0_500g || 0}
                onChange={(e) => handleRateChange(activeCourier, "zoneC_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-black text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Zone D */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-indigo-900">Zone D (ROI)</span>
              <span className="rounded bg-indigo-100 px-1 py-0.2 text-[8px] font-extrabold text-indigo-800">PRIMARY</span>
            </div>
            <p className="text-[10px] text-slate-500">Rest of India nationwide</p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-indigo-600">₹</span>
              <input
                type="number"
                min="10"
                value={currentRate.zoneD_0_500g || 0}
                onChange={(e) => handleRateChange(activeCourier, "zoneD_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-sm font-black text-indigo-950 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Zone E */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-slate-700">Zone E (Special)</span>
              <span className="text-[9px] font-bold text-slate-400">NE & J&K</span>
            </div>
            <p className="text-[10px] text-slate-500">North East, Islands & J&K</p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="10"
                value={currentRate.zoneE_0_500g || 0}
                onChange={(e) => handleRateChange(activeCourier, "zoneE_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-black text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Extra Slabs & COD Charges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <span className="text-xs font-bold text-slate-700 block mb-1">
              {isSurface ? "Additional 1.00 KG Slab Price" : "Additional 0.50 KG Slab Price"}
            </span>
            <p className="text-[10px] text-slate-500 mb-2">Charged for each incremental weight slab beyond base.</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                value={isSurface ? (currentRate.additionalKg || currentRate.additional500g || 20) : (currentRate.additional500g || 35)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (isSurface) {
                    handleRateChange(activeCourier, "additionalKg", val);
                    handleRateChange(activeCourier, "additional500g", val);
                  } else {
                    handleRateChange(activeCourier, "additional500g", val);
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <span className="text-xs font-bold text-slate-700 block mb-1">Flat COD Fee (₹)</span>
            <p className="text-[10px] text-slate-500 mb-2">Fixed handling fee applied on Cash on Delivery orders.</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                value={currentRate.codChargeFlat || 0}
                onChange={(e) => handleRateChange(activeCourier, "codChargeFlat", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <span className="text-xs font-bold text-slate-700 block mb-1">COD Percentage (%)</span>
            <p className="text-[10px] text-slate-500 mb-2">Percentage fee calculated on total order amount (0 = Free).</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">%</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={currentRate.codPercent || 0}
                onChange={(e) => handleRateChange(activeCourier, "codPercent", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            ℹ️ Changes saved here will be applied as default for all <strong>newly registered merchants</strong> and users on standard tier.
          </p>
          <button
            type="button"
            onClick={handleSaveGlobalRates}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 transition-all"
          >
            {saving ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Save size={16} />}
            <span>Save All Global Rates</span>
          </button>
        </div>
      </div>
    </div>
  );
}

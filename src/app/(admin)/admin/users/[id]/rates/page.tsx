"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Flame,
  IndianRupee,
  Plus,
  Radio,
  Save,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { assignUserCourierRatesAction } from "@/app/admin-actions";
import { DEFAULT_PRICING_TIERS, type PricingTier } from "@/lib/couriers/pricing-engine";

export default function AdminUserRatesPage() {
  const params = useParams();
  const router = useRouter();
  const userId = String(params.id || "usr-1");

  const [userName, setUserName] = useState("Dhananjay (Dhanbyte Logistics)");
  const [selectedTier, setSelectedTier] = useState<PricingTier>("STANDARD");
  const [loading, setLoading] = useState(false);

  const [rates, setRates] = useState({
    shadowfax: {
      courierCode: "shadowfax",
      courierName: "Shadowfax Express & Hyperlocal",
      zoneA_0_500g: 49,
      zoneB_0_500g: 59,
      zoneC_0_500g: 69,
      zoneD_0_500g: 79,
      additional500g: 35,
      codChargeFlat: 25,
      codPercent: 1.8,
    },
    xpressbees: {
      courierCode: "xpressbees",
      courierName: "Xpressbees Surface & Air",
      zoneA_0_500g: 52,
      zoneB_0_500g: 62,
      zoneC_0_500g: 72,
      zoneD_0_500g: 82,
      additional500g: 38,
      codChargeFlat: 25,
      codPercent: 1.8,
    },
    delhivery: {
      courierCode: "delhivery",
      courierName: "Delhivery Direct Logistics",
      zoneA_0_500g: 55,
      zoneB_0_500g: 65,
      zoneC_0_500g: 75,
      zoneD_0_500g: 85,
      additional500g: 40,
      codChargeFlat: 30,
      codPercent: 2.0,
    },
  });

  function handleTierSelect(tier: PricingTier) {
    setSelectedTier(tier);
    if (tier !== "CUSTOM") {
      setRates(JSON.parse(JSON.stringify(DEFAULT_PRICING_TIERS[tier])));
      toast.info(`Applied ${tier} Pricing Template`);
    }
  }

  function handleRateChange(courier: string, field: string, value: number) {
    setSelectedTier("CUSTOM");
    setRates((prev: any) => ({
      ...prev,
      [courier]: {
        ...prev[courier],
        [field]: value,
      },
    }));
  }

  async function handleSave() {
    setLoading(true);
    const res = await assignUserCourierRatesAction({
      userId,
      userName,
      tier: selectedTier,
      rates,
    });
    setLoading(false);

    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/users" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft size={13} /> Back to Users List
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700">Custom Courier Rate Card</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Assign Courier Rates for: <span className="text-indigo-600">{userName}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Configure custom per-courier pricing slabs for this specific merchant account.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Save size={15} />
          <span>{loading ? "Saving Rates…" : "Save Custom Rates"}</span>
        </button>
      </div>

      {/* Pricing Tier Presets */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Tag size={14} className="text-indigo-600" /> Step 1: Select Pricing Plan Template
        </h3>

        <div className="grid gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => handleTierSelect("STANDARD")}
            className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedTier === "STANDARD"
                ? "border-indigo-600 bg-indigo-50/70 shadow-xs"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">🥉 Standard / Bronze</span>
              {selectedTier === "STANDARD" && <CheckCircle2 size={15} className="text-indigo-600" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Default for new merchants</p>
            <p className="text-xs font-mono font-bold text-indigo-700 mt-2">Shadowfax: ₹49</p>
          </button>

          <button
            type="button"
            onClick={() => handleTierSelect("SILVER")}
            className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedTier === "SILVER"
                ? "border-indigo-600 bg-indigo-50/70 shadow-xs"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">🥈 Silver (High Volume)</span>
              {selectedTier === "SILVER" && <CheckCircle2 size={15} className="text-indigo-600" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">100+ shipments / month</p>
            <p className="text-xs font-mono font-bold text-indigo-700 mt-2">Shadowfax: ₹42</p>
          </button>

          <button
            type="button"
            onClick={() => handleTierSelect("GOLD")}
            className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedTier === "GOLD"
                ? "border-indigo-600 bg-indigo-50/70 shadow-xs"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">🥇 Gold (Enterprise)</span>
              {selectedTier === "GOLD" && <CheckCircle2 size={15} className="text-indigo-600" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">500+ shipments / month</p>
            <p className="text-xs font-mono font-bold text-indigo-700 mt-2">Shadowfax: ₹38</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTier("CUSTOM")}
            className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedTier === "CUSTOM"
                ? "border-indigo-600 bg-indigo-50/70 shadow-xs"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">🛠️ Custom Rates</span>
              {selectedTier === "CUSTOM" && <CheckCircle2 size={15} className="text-indigo-600" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Manual pricing per courier</p>
            <p className="text-xs font-mono font-bold text-indigo-700 mt-2">Custom Slabs</p>
          </button>
        </div>
      </div>

      {/* Step 2: Per-Courier Rate Cards Table */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Scale size={14} className="text-indigo-600" /> Step 2: Configure Individual Courier Company Prices
        </h3>

        {Object.entries(rates).map(([code, r]: [string, any]) => (
          <div
            key={code}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Radio size={16} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{r.courierName}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Code: {code}</span>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Active on Seller Checkout
              </span>
            </div>

            {/* Zone & Weight Pricing Matrix Grid */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Zone A (Intra-City)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={r.zoneA_0_500g}
                    onChange={(e) => handleRateChange(code, "zoneA_0_500g", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Zone B (Regional)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={r.zoneB_0_500g}
                    onChange={(e) => handleRateChange(code, "zoneB_0_500g", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Zone C (Metro)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={r.zoneC_0_500g}
                    onChange={(e) => handleRateChange(code, "zoneC_0_500g", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Zone D (Rest of India)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={r.zoneD_0_500g}
                    onChange={(e) => handleRateChange(code, "zoneD_0_500g", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Addl. 500g Slab
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={r.additional500g}
                    onChange={(e) => handleRateChange(code, "additional500g", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  COD Flat Fee / %
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={r.codChargeFlat}
                    onChange={(e) => handleRateChange(code, "codChargeFlat", Number(e.target.value))}
                    className="w-16 rounded-lg border border-slate-300 p-1.5 text-xs font-bold text-amber-800 focus:border-indigo-600 focus:outline-none"
                  />
                  <span className="text-slate-400 text-[10px]">({r.codPercent}%)</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

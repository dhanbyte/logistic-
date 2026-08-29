"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Flame,
  IndianRupee,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { assignUserCourierRatesAction, getAllMerchantsAction, getUserPricingProfileAction } from "@/app/admin-actions";
import { DEFAULT_PRICING_TIERS, type PricingTier } from "@/lib/couriers/pricing-engine";
import { formatINR } from "@/lib/calculations";

export default function AdminUserRatesPage() {
  const params = useParams();
  const router = useRouter();
  const rawUserId = String(params.id || "usr-1");

  const [selectedUserId, setSelectedUserId] = useState(rawUserId);
  const [userName, setUserName] = useState("Selected Merchant");
  const [selectedTier, setSelectedTier] = useState<PricingTier>("CUSTOM");
  const [loading, setLoading] = useState(false);

  // Available Merchant List for Dropdown Switcher
  const [userList, setUserList] = useState<{ id: string; name: string; email: string }[]>([
    { id: "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5", name: "Dhananjay (Dhanbyte Logistics)", email: "dhananjay.win2004@gmail.com" },
    { id: "1021f9f6-a770-42ba-b0de-fb5315337c46", name: "dhananjay.win545", email: "dhananjay.win545@gmail.com" },
    { id: "28b1226e-c0b6-448c-90c8-372df9d65097", name: "Shan Bhati", email: "shanbhati2003@gmail.com" },
  ]);

  // Shadowfax multi-slab rate matrix for this specific user with all 5 zones (A, B, C, D, E)
  const [shadowfaxSlabs, setShadowfaxSlabs] = useState([
    { slab: "0–500g", maxWeight: 0.5, zoneA: 45, zoneB: 52, zoneC: 62, zoneD: 72, zoneE: 88, codFee: 0 },
    { slab: "500g–1kg", maxWeight: 1.0, zoneA: 60, zoneB: 70, zoneC: 82, zoneD: 96, zoneE: 115, codFee: 0 },
    { slab: "1kg–1.5kg", maxWeight: 1.5, zoneA: 75, zoneB: 88, zoneC: 105, zoneD: 124, zoneE: 145, codFee: 0 },
    { slab: "1.5kg–2kg", maxWeight: 2.0, zoneA: 90, zoneB: 105, zoneC: 128, zoneD: 152, zoneE: 175, codFee: 0 },
    { slab: "2kg–5kg", maxWeight: 5.0, zoneA: 155, zoneB: 185, zoneC: 225, zoneD: 270, zoneE: 320, codFee: 0 },
    { slab: "5kg–7kg", maxWeight: 7.0, zoneA: 220, zoneB: 260, zoneC: 310, zoneD: 375, zoneE: 440, codFee: 0 },
    { slab: "7kg–10kg", maxWeight: 10.0, zoneA: 300, zoneB: 360, zoneC: 430, zoneD: 515, zoneE: 610, codFee: 0 },
    { slab: "Above 10kg (+1kg)", maxWeight: 99.0, zoneA: 30, zoneB: 36, zoneC: 42, zoneD: 50, zoneE: 65, codFee: 0 },
  ]);

  // Xpressbees & Delhivery rates across all 5 zones (A, B, C, D, E)
  const [otherCouriers, setOtherCouriers] = useState({
    xpressbees: {
      zoneA_0_500g: 52,
      zoneB_0_500g: 62,
      zoneC_0_500g: 72,
      zoneD_0_500g: 82,
      zoneE_0_500g: 98,
      additional500g: 38,
      codChargeFlat: 0,
    },
    delhivery: {
      zoneA_0_500g: 55,
      zoneB_0_500g: 65,
      zoneC_0_500g: 75,
      zoneD_0_500g: 85,
      zoneE_0_500g: 105,
      additional500g: 40,
      codChargeFlat: 0,
    },
  });

  useEffect(() => {
    async function loadMerchants() {
      const list = await getAllMerchantsAction();
      if (list && list.length > 0) {
        setUserList(list);
        const matched = list.find((u) => u.id === selectedUserId) || list[0];
        if (matched) {
          setUserName(matched.name);
          if (selectedUserId === "usr-1") {
            setSelectedUserId(matched.id);
          }
        }
      }
    }
    loadMerchants();
  }, []);

  useEffect(() => {
    async function loadUserProfile() {
      if (!selectedUserId) return;
      const matched = userList.find((u) => u.id === selectedUserId);
      if (matched) setUserName(matched.name);

      const profile = await getUserPricingProfileAction(selectedUserId);
      if (profile) {
        setSelectedTier(profile.tier || "CUSTOM");
        if (profile.rates?.shadowfax?.slabs) {
          setShadowfaxSlabs(profile.rates.shadowfax.slabs);
        }
        if (profile.rates?.xpressbees) {
          setOtherCouriers((prev) => ({
            ...prev,
            xpressbees: {
              ...prev.xpressbees,
              ...profile.rates.xpressbees,
            },
            delhivery: {
              ...prev.delhivery,
              ...(profile.rates.delhivery || {}),
            },
          }));
        }
      }
    }
    loadUserProfile();
  }, [selectedUserId]);

  function handleUserSelect(newId: string) {
    setSelectedUserId(newId);
    router.push(`/admin/users/${newId}/rates`);
  }

  function handleShadowfaxChange(idx: number, field: string, value: number) {
    setSelectedTier("CUSTOM");
    setShadowfaxSlabs((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  }

  function handleOtherCourierChange(courier: "xpressbees" | "delhivery", field: string, value: number) {
    setSelectedTier("CUSTOM");
    setOtherCouriers((prev) => ({
      ...prev,
      [courier]: {
        ...prev[courier],
        [field]: value,
      },
    }));
  }

  async function handleSave() {
    setLoading(true);
    const customRatePayload = {
      shadowfax: {
        courierCode: "shadowfax",
        courierName: "Shadowfax Express",
        zoneA_0_500g: shadowfaxSlabs[0].zoneA,
        zoneB_0_500g: shadowfaxSlabs[0].zoneB,
        zoneC_0_500g: shadowfaxSlabs[0].zoneC,
        zoneD_0_500g: shadowfaxSlabs[0].zoneD,
        zoneE_0_500g: shadowfaxSlabs[0].zoneE,
        additional500g: shadowfaxSlabs[7].zoneD,
        codChargeFlat: shadowfaxSlabs[0].codFee,
        codPercent: 0,
        slabs: shadowfaxSlabs,
      },
      xpressbees: {
        courierCode: "xpressbees",
        courierName: "Xpressbees Surface",
        ...otherCouriers.xpressbees,
        codPercent: 0,
      },
      delhivery: {
        courierCode: "delhivery",
        courierName: "Delhivery Direct",
        ...otherCouriers.delhivery,
        codPercent: 0,
      },
    };

    const res = await assignUserCourierRatesAction({
      userId: selectedUserId,
      userName,
      tier: selectedTier,
      rates: customRatePayload,
    });
    setLoading(false);

    if (res.ok) {
      toast.success(`Custom rates saved for ${userName}! These rates will now be used for shipping.`);
    } else {
      toast.error(res.message);
    }
  }

  function applyTemplateTier(tier: PricingTier) {
    setSelectedTier(tier);
    if (tier === "STANDARD") {
      setShadowfaxSlabs((prev) =>
        prev.map((s) => ({ ...s, zoneA: s.zoneA, zoneB: s.zoneB, zoneC: s.zoneC, zoneD: s.zoneD, zoneE: s.zoneE }))
      );
      setOtherCouriers({
        xpressbees: { zoneA_0_500g: 52, zoneB_0_500g: 62, zoneC_0_500g: 72, zoneD_0_500g: 82, zoneE_0_500g: 98, additional500g: 38, codChargeFlat: 0 },
        delhivery: { zoneA_0_500g: 55, zoneB_0_500g: 65, zoneC_0_500g: 75, zoneD_0_500g: 85, zoneE_0_500g: 105, additional500g: 40, codChargeFlat: 0 },
      });
      toast.info("Applied Standard Tier Rates");
    } else if (tier === "SILVER") {
      setShadowfaxSlabs((prev) =>
        prev.map((s) => ({ ...s, zoneA: Math.round(s.zoneA * 0.9), zoneB: Math.round(s.zoneB * 0.9), zoneC: Math.round(s.zoneC * 0.9), zoneD: Math.round(s.zoneD * 0.9), zoneE: Math.round(s.zoneE * 0.9) }))
      );
      setOtherCouriers({
        xpressbees: { zoneA_0_500g: 45, zoneB_0_500g: 55, zoneC_0_500g: 65, zoneD_0_500g: 75, zoneE_0_500g: 90, additional500g: 32, codChargeFlat: 0 },
        delhivery: { zoneA_0_500g: 48, zoneB_0_500g: 58, zoneC_0_500g: 68, zoneD_0_500g: 78, zoneE_0_500g: 95, additional500g: 35, codChargeFlat: 0 },
      });
      toast.info("Applied Silver Tier (10% Discount)");
    } else if (tier === "GOLD") {
      setShadowfaxSlabs((prev) =>
        prev.map((s) => ({ ...s, zoneA: Math.round(s.zoneA * 0.8), zoneB: Math.round(s.zoneB * 0.8), zoneC: Math.round(s.zoneC * 0.8), zoneD: Math.round(s.zoneD * 0.8), zoneE: Math.round(s.zoneE * 0.8) }))
      );
      setOtherCouriers({
        xpressbees: { zoneA_0_500g: 40, zoneB_0_500g: 50, zoneC_0_500g: 60, zoneD_0_500g: 70, zoneE_0_500g: 85, additional500g: 28, codChargeFlat: 0 },
        delhivery: { zoneA_0_500g: 42, zoneB_0_500g: 52, zoneC_0_500g: 62, zoneD_0_500g: 72, zoneE_0_500g: 88, additional500g: 30, codChargeFlat: 0 },
      });
      toast.info("Applied Gold Tier (20% Discount)");
    }
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Back to All Users
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-indigo-600">Custom Rate Cards</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>Merchant Rate Card Editor:</span>
            <span className="text-indigo-600">{userName}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure custom per-zone shipping rates across all 5 zones (A, B, C, D, E). The exact rates entered here will be deducted when this merchant ships parcels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save size={15} />
            <span>{loading ? "Saving Rates…" : "Save Custom Rates"}</span>
          </button>
        </div>
      </div>

      {/* User Switcher & Pricing Plan Tier Ribbon */}
      <div className="grid gap-4 sm:grid-cols-12">
        {/* User Switcher */}
        <div className="sm:col-span-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <User size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Merchant User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => handleUserSelect(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
            >
              {userList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Plan Preset Selector */}
        <div className="sm:col-span-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between gap-2">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pricing Tier Preset
            </label>
            <p className="text-xs text-slate-600 mt-0.5">
              Active: <strong className="text-indigo-600 font-bold">{selectedTier}</strong>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => applyTemplateTier("STANDARD")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedTier === "STANDARD"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => applyTemplateTier("SILVER")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedTier === "SILVER"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Silver (-10%)
            </button>
            <button
              onClick={() => applyTemplateTier("GOLD")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedTier === "GOLD"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Gold (-20%)
            </button>
          </div>
        </div>
      </div>

      {/* 1. SHADOWFAX MULTI-SLAB RATE CARD (ZONES A, B, C, D, E) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-500 text-white font-black text-sm">
              S
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">
                Shadowfax Express — 5-Zone Multi-Slab Custom Rates
              </h3>
              <p className="text-[11px] text-slate-300">
                Custom prepaid freight rates per weight slab across <strong>Zones A, B, C, D &amp; E</strong>.
              </p>
            </div>
          </div>
          <span className="rounded bg-orange-500/30 text-orange-200 text-[10px] font-mono font-bold px-2.5 py-1">
            shadowfax
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Weight Slab</th>
                <th className="py-3 px-4">Zone A (Intra-City)</th>
                <th className="py-3 px-4">Zone B (Regional)</th>
                <th className="py-3 px-4">Zone C (Metro)</th>
                <th className="py-3 px-4">Zone D (Rest of India)</th>
                <th className="py-3 px-4 bg-indigo-50/50 text-indigo-900">Zone E (Special / NE / J&K)</th>
                <th className="py-3 px-4">COD Fee (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {shadowfaxSlabs.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <span className="inline-block rounded-lg bg-indigo-50 border border-indigo-200/70 px-2.5 py-1 font-mono font-bold text-indigo-800 text-xs">
                      {s.slab}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={s.zoneA}
                        onChange={(e) => handleShadowfaxChange(idx, "zoneA", Number(e.target.value))}
                        className="w-18 rounded-lg border border-slate-300 p-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={s.zoneB}
                        onChange={(e) => handleShadowfaxChange(idx, "zoneB", Number(e.target.value))}
                        className="w-18 rounded-lg border border-slate-300 p-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={s.zoneC}
                        onChange={(e) => handleShadowfaxChange(idx, "zoneC", Number(e.target.value))}
                        className="w-18 rounded-lg border border-slate-300 p-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={s.zoneD}
                        onChange={(e) => handleShadowfaxChange(idx, "zoneD", Number(e.target.value))}
                        className="w-18 rounded-lg border border-slate-300 p-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </td>

                  <td className="py-3 px-4 bg-indigo-50/30">
                    <div className="flex items-center gap-1">
                      <span className="text-indigo-500 font-bold">₹</span>
                      <input
                        type="number"
                        value={s.zoneE}
                        onChange={(e) => handleShadowfaxChange(idx, "zoneE", Number(e.target.value))}
                        className="w-18 rounded-lg border border-indigo-300 bg-white p-1 font-bold text-indigo-950 text-xs focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={s.codFee}
                        onChange={(e) => handleShadowfaxChange(idx, "codFee", Number(e.target.value))}
                        className="w-16 rounded-lg border border-slate-300 p-1 font-bold text-emerald-800 text-xs focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. OTHER COURIER RATES (Xpressbees & Delhivery) WITH ALL 5 ZONES */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Xpressbees */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Truck size={15} className="text-blue-600" /> Xpressbees Surface (5 Zones)
            </h4>
            <span className="text-[10px] font-mono text-slate-400">xpressbees</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Zone A (Local)</label>
              <input
                type="number"
                value={otherCouriers.xpressbees.zoneA_0_500g}
                onChange={(e) => handleOtherCourierChange("xpressbees", "zoneA_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Zone B (Regional)</label>
              <input
                type="number"
                value={otherCouriers.xpressbees.zoneB_0_500g}
                onChange={(e) => handleOtherCourierChange("xpressbees", "zoneB_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Zone C (Metro)</label>
              <input
                type="number"
                value={otherCouriers.xpressbees.zoneC_0_500g}
                onChange={(e) => handleOtherCourierChange("xpressbees", "zoneC_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Zone D (ROI)</label>
              <input
                type="number"
                value={otherCouriers.xpressbees.zoneD_0_500g}
                onChange={(e) => handleOtherCourierChange("xpressbees", "zoneD_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] text-indigo-700 font-bold mb-0.5">Zone E (Special/NE)</label>
              <input
                type="number"
                value={otherCouriers.xpressbees.zoneE_0_500g}
                onChange={(e) => handleOtherCourierChange("xpressbees", "zoneE_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-indigo-300 bg-indigo-50/40 p-1.5 font-bold text-indigo-950"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">+500g Add Slab</label>
              <input
                type="number"
                value={otherCouriers.xpressbees.additional500g}
                onChange={(e) => handleOtherCourierChange("xpressbees", "additional500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Delhivery */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Truck size={15} className="text-emerald-600" /> Delhivery Direct (5 Zones)
            </h4>
            <span className="text-[10px] font-mono text-slate-400">delhivery</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Zone A (Local)</label>
              <input
                type="number"
                value={otherCouriers.delhivery.zoneA_0_500g}
                onChange={(e) => handleOtherCourierChange("delhivery", "zoneA_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Zone B (Regional)</label>
              <input
                type="number"
                value={otherCouriers.delhivery.zoneB_0_500g}
                onChange={(e) => handleOtherCourierChange("delhivery", "zoneB_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Zone C (Metro)</label>
              <input
                type="number"
                value={otherCouriers.delhivery.zoneC_0_500g}
                onChange={(e) => handleOtherCourierChange("delhivery", "zoneC_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Zone D (ROI)</label>
              <input
                type="number"
                value={otherCouriers.delhivery.zoneD_0_500g}
                onChange={(e) => handleOtherCourierChange("delhivery", "zoneD_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] text-indigo-700 font-bold mb-0.5">Zone E (Special/NE)</label>
              <input
                type="number"
                value={otherCouriers.delhivery.zoneE_0_500g}
                onChange={(e) => handleOtherCourierChange("delhivery", "zoneE_0_500g", Number(e.target.value))}
                className="w-full rounded-lg border border-indigo-300 bg-indigo-50/40 p-1.5 font-bold text-indigo-950"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">+500g Add Slab</label>
              <input
                type="number"
                value={otherCouriers.delhivery.additional500g}
                onChange={(e) => handleOtherCourierChange("delhivery", "additional500g", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-1.5 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

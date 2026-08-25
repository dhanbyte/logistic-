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
import { assignUserCourierRatesAction } from "@/app/admin-actions";
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
  const [userList, setUserList] = useState([
    { id: "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5", name: "Dhananjay (Dhanbyte Logistics)", email: "dhananjay.win2004@gmail.com" },
    { id: "e6443c2c-a292-491c-bf0d-856114e9f7fc", name: "Mrityunjay Singh (Gali no.8)", email: "mrityunjay.win2997@gmail.com" },
    { id: "c9c71eb9-cf36-4100-bf6c-7f5b7aa21cfa", name: "bhawani (Bhawani Enterprise)", email: "bhawanisingh2997@gmail.com" },
    { id: "7a876cd5-bf09-4c54-b4be-02d56af6f0a5", name: "Dhananjay Admin", email: "dhananjay@dhanbyte.me" },
  ]);

  // Shadowfax multi-slab rate matrix for this specific user
  const [shadowfaxSlabs, setShadowfaxSlabs] = useState([
    { slab: "0–500g", maxWeight: 0.5, zoneA: 45, zoneB: 52, zoneC: 62, zoneD: 72, codFee: 20 },
    { slab: "500g–1kg", maxWeight: 1.0, zoneA: 60, zoneB: 70, zoneC: 82, zoneD: 96, codFee: 20 },
    { slab: "1kg–1.5kg", maxWeight: 1.5, zoneA: 75, zoneB: 88, zoneC: 105, zoneD: 124, codFee: 25 },
    { slab: "1.5kg–2kg", maxWeight: 2.0, zoneA: 90, zoneB: 105, zoneC: 128, zoneD: 152, codFee: 25 },
    { slab: "2kg–5kg", maxWeight: 5.0, zoneA: 155, zoneB: 185, zoneC: 225, zoneD: 270, codFee: 30 },
    { slab: "5kg–7kg", maxWeight: 7.0, zoneA: 220, zoneB: 260, zoneC: 310, zoneD: 375, codFee: 35 },
    { slab: "7kg–10kg", maxWeight: 10.0, zoneA: 300, zoneB: 360, zoneC: 430, zoneD: 515, codFee: 40 },
    { slab: "Above 10kg (+1kg)", maxWeight: 99.0, zoneA: 30, zoneB: 36, zoneC: 42, zoneD: 50, codFee: 10 },
  ]);

  // Xpressbees & Delhivery rates
  const [otherCouriers, setOtherCouriers] = useState({
    xpressbees: {
      zoneA_0_500g: 52,
      zoneB_0_500g: 62,
      zoneC_0_500g: 72,
      zoneD_0_500g: 82,
      additional500g: 38,
      codChargeFlat: 25,
    },
    delhivery: {
      zoneA_0_500g: 55,
      zoneB_0_500g: 65,
      zoneC_0_500g: 75,
      zoneD_0_500g: 85,
      additional500g: 40,
      codChargeFlat: 30,
    },
  });

  useEffect(() => {
    const matched = userList.find((u) => u.id === selectedUserId);
    if (matched) {
      setUserName(matched.name);
    }
  }, [selectedUserId, userList]);

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
    const res = await assignUserCourierRatesAction({
      userId: selectedUserId,
      userName,
      tier: selectedTier,
      rates: {
        shadowfaxSlabs,
        xpressbees: otherCouriers.xpressbees,
        delhivery: otherCouriers.delhivery,
      },
    });
    setLoading(false);

    if (res.ok) {
      toast.success(`Custom rates for ${userName} saved successfully!`);
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
            <Link href="/admin/users" className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
              <ArrowLeft size={13} /> Back to Users List
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700">Custom Merchant Rate Card</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Custom Courier Rates:</span>
            <span className="text-indigo-600">{userName}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Set custom negotiated weight slabs (500g, 1kg, 2kg, 5kg, 10kg) and per-zone prices for this merchant.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Save size={15} />
          <span>{loading ? "Saving Rates…" : "Save Custom Rates for User"}</span>
        </button>
      </div>

      {/* Target User Selector Bar */}
      <div className="rounded-2xl border border-indigo-200 bg-linear-to-r from-indigo-50/70 to-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Users size={18} />
          </span>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Configuring Rates For Merchant Account:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => handleUserSelect(e.target.value)}
              className="mt-0.5 font-bold text-sm text-slate-900 bg-transparent border-0 border-b-2 border-indigo-600 focus:outline-none cursor-pointer pr-4"
            >
              {userList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Merchant Custom Rate Active
          </span>
        </div>
      </div>

      {/* 1. SHADOWFAX COMPREHENSIVE MULTI-SLAB TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-orange-500/20 border border-orange-400/30 text-orange-400">
              <Truck size={16} />
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">
                Shadowfax Express — Multi-Slab Custom Rates
              </h3>
              <p className="text-[11px] text-slate-300">
                Custom negotiated rates per weight slab (500g to 10kg+) across Zones A, B, C &amp; D.
              </p>
            </div>
          </div>
          <span className="rounded bg-orange-500/30 text-orange-200 text-[10px] font-mono font-bold px-2 py-0.5">
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
                        className="w-20 rounded-lg border border-slate-300 p-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
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
                        className="w-20 rounded-lg border border-slate-300 p-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
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
                        className="w-20 rounded-lg border border-slate-300 p-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
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
                        className="w-20 rounded-lg border border-slate-300 p-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
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
                        className="w-16 rounded-lg border border-slate-300 p-1 font-bold text-amber-800 text-xs focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. OTHER COURIER RATES (Xpressbees & Delhivery) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Xpressbees */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Truck size={15} className="text-blue-600" /> Xpressbees Surface
            </h4>
            <span className="text-[10px] font-mono text-slate-400">xpressbees</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
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
          </div>
        </div>

        {/* Delhivery */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Truck size={15} className="text-emerald-600" /> Delhivery Direct
            </h4>
            <span className="text-[10px] font-mono text-slate-400">delhivery</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
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
          </div>
        </div>
      </div>
    </div>
  );
}

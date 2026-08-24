"use client";

import { useState } from "react";
import { Edit3, IndianRupee, Plus, Save, Scale, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/calculations";
import { updateShippingRateAction } from "@/app/admin-actions";

export default function AdminRatesPage() {
  const [slabs, setSlabs] = useState([
    {
      id: "slab-01",
      courierName: "Shadowfax Express",
      zone: "ZONE_A (Intra-City)",
      weightSlab: "0–500g",
      courierBaseCost: 38,
      userPrepaidPrice: 49,
      userCodPrice: 69,
    },
    {
      id: "slab-02",
      courierName: "Shadowfax Express",
      zone: "ZONE_B (Regional)",
      weightSlab: "0–500g",
      courierBaseCost: 45,
      userPrepaidPrice: 59,
      userCodPrice: 79,
    },
    {
      id: "slab-03",
      courierName: "Xpressbees Surface",
      zone: "ZONE_C (Metro to Metro)",
      weightSlab: "500g–1kg",
      courierBaseCost: 52,
      userPrepaidPrice: 69,
      userCodPrice: 89,
    },
    {
      id: "slab-04",
      courierName: "Delhivery Direct",
      zone: "ZONE_D (Rest of India)",
      weightSlab: "1kg–2kg",
      courierBaseCost: 75,
      userPrepaidPrice: 99,
      userCodPrice: 125,
    },
  ]);

  const [savingId, setSavingId] = useState<string | null>(null);

  function handleRateChange(id: string, field: "userPrepaidPrice" | "userCodPrice", val: number) {
    setSlabs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
    );
  }

  async function handleSaveSlab(s: any) {
    setSavingId(s.id);
    const res = await updateShippingRateAction(s.id, s.userPrepaidPrice, s.userCodPrice);
    setSavingId(null);
    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shipping Rate Slabs &amp; Platform Margin</h1>
          <p className="text-xs text-slate-500">
            Configure shipping prices charged to sellers. The system automatically computes your gross platform margin.
          </p>
        </div>
      </div>

      {/* Margins Formula Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-linear-to-r from-indigo-50 to-white p-4 text-xs text-slate-700 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white font-black">
            ₹
          </span>
          <div>
            <p className="font-bold text-slate-900">Automated Platform Margin Formula</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              <code>Platform Margin = Price Charged to Seller (₹) − Courier Base Negotiated Cost (₹)</code>
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-3 py-1 text-xs">
          Active Dynamic Pricing
        </span>
      </div>

      {/* Slabs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Courier Partner</th>
                <th className="py-3 px-4">Shipping Zone</th>
                <th className="py-3 px-4">Weight Slab</th>
                <th className="py-3 px-4">Courier Cost</th>
                <th className="py-3 px-4">Seller Prepaid Price</th>
                <th className="py-3 px-4">Seller COD Price</th>
                <th className="py-3 px-4">Gross Margin</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {slabs.map((s) => {
                const marginPrepaid = s.userPrepaidPrice - s.courierBaseCost;
                const marginCod = s.userCodPrice - s.courierBaseCost;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.courierName}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{s.zone}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{s.weightSlab}</td>
                    <td className="py-3 px-4 font-bold text-slate-500">{formatINR(s.courierBaseCost)}</td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={s.userPrepaidPrice}
                          onChange={(e) =>
                            handleRateChange(s.id, "userPrepaidPrice", Number(e.target.value))
                          }
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={s.userCodPrice}
                          onChange={(e) =>
                            handleRateChange(s.id, "userCodPrice", Number(e.target.value))
                          }
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 font-bold text-amber-800 text-xs focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold">
                      <span className="text-emerald-700 block">+{formatINR(marginPrepaid)} (Prepaid)</span>
                      <span className="text-amber-700 block text-[10px]">+{formatINR(marginCod)} (COD)</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={savingId === s.id}
                        onClick={() => handleSaveSlab(s)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 shadow-xs"
                      >
                        <Save size={12} />
                        <span>{savingId === s.id ? "Saving…" : "Save Rate"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

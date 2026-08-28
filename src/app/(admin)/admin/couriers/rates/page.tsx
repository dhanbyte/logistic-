"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Edit3,
  Filter,
  IndianRupee,
  Layers,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Scale,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/calculations";
import { updateShippingRateAction } from "@/app/admin-actions";

export interface RateSlabItem {
  id: string;
  courierCode: string;
  courierName: string;
  zone: string;
  zoneLabel: string;
  weightSlab: string;
  maxWeightKg: number;
  courierBaseCost: number;
  userPrepaidPrice: number;
  userCodPrice: number;
}

const INITIAL_SHADOWFAX_SLABS: RateSlabItem[] = [
  // 1. SHADOWFAX EXPRESS (0.5KG LITE PLAN - ₹78)
  { id: "sfx-a-0.5", courierCode: "shadowfax", courierName: "Shadowfax Express", zone: "ZONE_A", zoneLabel: "ZONE_A (Intra-City)", weightSlab: "0–500g", maxWeightKg: 0.5, courierBaseCost: 35, userPrepaidPrice: 78, userCodPrice: 98 },
  { id: "sfx-b-0.5", courierCode: "shadowfax", courierName: "Shadowfax Express", zone: "ZONE_B", zoneLabel: "ZONE_B (Regional)", weightSlab: "0–500g", maxWeightKg: 0.5, courierBaseCost: 40, userPrepaidPrice: 78, userCodPrice: 98 },
  { id: "sfx-c-0.5", courierCode: "shadowfax", courierName: "Shadowfax Express", zone: "ZONE_C", zoneLabel: "ZONE_C (Metro to Metro)", weightSlab: "0–500g", maxWeightKg: 0.5, courierBaseCost: 45, userPrepaidPrice: 78, userCodPrice: 98 },
  { id: "sfx-d-0.5", courierCode: "shadowfax", courierName: "Shadowfax Express", zone: "ZONE_D", zoneLabel: "ZONE_D (Rest of India)", weightSlab: "0–500g", maxWeightKg: 0.5, courierBaseCost: 52, userPrepaidPrice: 78, userCodPrice: 98 },
  { id: "sfx-e-0.5", courierCode: "shadowfax", courierName: "Shadowfax Express", zone: "ZONE_E", zoneLabel: "ZONE_E (Special / NE)", weightSlab: "0–500g", maxWeightKg: 0.5, courierBaseCost: 65, userPrepaidPrice: 98, userCodPrice: 118 },

  // 2. SHADOWFAX CARGO (HEAVY SLABS: 1KG=₹96, 3KG=₹126, 5KG=₹146, 7KG=₹166, >7KG=+₹20/KG)
  // 1kg Slab
  { id: "sfx-cargo-1.0", courierCode: "shadowfax_surface", courierName: "Shadowfax Cargo", zone: "ZONE_ALL", zoneLabel: "All Zones (India)", weightSlab: "0.5kg–1kg", maxWeightKg: 1.0, courierBaseCost: 69, userPrepaidPrice: 96, userCodPrice: 116 },
  // 1kg to 3kg Slab (+₹30 -> ₹126)
  { id: "sfx-cargo-3.0", courierCode: "shadowfax_surface", courierName: "Shadowfax Cargo", zone: "ZONE_ALL", zoneLabel: "All Zones (India)", weightSlab: "1kg–3kg", maxWeightKg: 3.0, courierBaseCost: 69, userPrepaidPrice: 126, userCodPrice: 146 },
  // 3kg to 5kg Slab (+₹20 -> ₹146)
  { id: "sfx-cargo-5.0", courierCode: "shadowfax_surface", courierName: "Shadowfax Cargo", zone: "ZONE_ALL", zoneLabel: "All Zones (India)", weightSlab: "3kg–5kg", maxWeightKg: 5.0, courierBaseCost: 69, userPrepaidPrice: 146, userCodPrice: 166 },
  // 5kg to 7kg Slab (+₹20 -> ₹166)
  { id: "sfx-cargo-7.0", courierCode: "shadowfax_surface", courierName: "Shadowfax Cargo", zone: "ZONE_ALL", zoneLabel: "All Zones (India)", weightSlab: "5kg–7kg", maxWeightKg: 7.0, courierBaseCost: 69, userPrepaidPrice: 166, userCodPrice: 186 },
  // Above 7kg Slab (+₹20/kg)
  { id: "sfx-cargo-addl", courierCode: "shadowfax_surface", courierName: "Shadowfax Cargo", zone: "ZONE_ALL", zoneLabel: "All Zones (India)", weightSlab: "Above 7kg (+1kg)", maxWeightKg: 99.0, courierBaseCost: 15, userPrepaidPrice: 20, userCodPrice: 20 },
];

export default function AdminRatesPage() {
  const [slabs, setSlabs] = useState<RateSlabItem[]>(INITIAL_SHADOWFAX_SLABS);
  const [selectedCourier, setSelectedCourier] = useState<string>("shadowfax");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // New Slab Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlab, setNewSlab] = useState({
    courierCode: "shadowfax",
    courierName: "Shadowfax Express",
    zone: "ZONE_A",
    weightSlab: "2kg–5kg",
    maxWeightKg: 5.0,
    courierBaseCost: 120,
    userPrepaidPrice: 155,
    userCodPrice: 185,
  });

  function handleRateChange(id: string, field: keyof RateSlabItem, val: number) {
    setSlabs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  }

  async function handleSaveSlab(s: RateSlabItem) {
    setSavingId(s.id);
    const res = await updateShippingRateAction(s.id, s.userPrepaidPrice, s.userCodPrice);
    setSavingId(null);
    if (res.ok) {
      toast.success(`${s.courierName} (${s.zone} ${s.weightSlab}) rate saved!`);
    } else {
      toast.error(res.message);
    }
  }

  async function handleSaveAll() {
    setIsSavingAll(true);
    for (const s of filteredSlabs) {
      await updateShippingRateAction(s.id, s.userPrepaidPrice, s.userCodPrice);
    }
    setIsSavingAll(false);
    toast.success(`All ${filteredSlabs.length} shipping rate slabs saved successfully!`);
  }

  function handleAddSlab() {
    const id = `slab-custom-${Date.now()}`;
    const zoneLabels: Record<string, string> = {
      ZONE_A: "ZONE_A (Intra-City)",
      ZONE_B: "ZONE_B (Regional)",
      ZONE_C: "ZONE_C (Metro to Metro)",
      ZONE_D: "ZONE_D (Rest of India)",
      ZONE_E: "ZONE_E (Special / NE)",
    };

    const created: RateSlabItem = {
      id,
      courierCode: newSlab.courierCode,
      courierName: newSlab.courierName,
      zone: newSlab.zone,
      zoneLabel: zoneLabels[newSlab.zone] || newSlab.zone,
      weightSlab: newSlab.weightSlab,
      maxWeightKg: Number(newSlab.maxWeightKg),
      courierBaseCost: Number(newSlab.courierBaseCost),
      userPrepaidPrice: Number(newSlab.userPrepaidPrice),
      userCodPrice: Number(newSlab.userCodPrice),
    };

    setSlabs((prev) => [created, ...prev]);
    setShowAddModal(false);
    toast.success("New rate slab added successfully!");
  }

  function handleDeleteSlab(id: string) {
    setSlabs((prev) => prev.filter((s) => s.id !== id));
    toast.info("Rate slab removed.");
  }

  // Filtered List
  const filteredSlabs = slabs.filter((s) => {
    if (selectedCourier !== "ALL" && s.courierCode !== selectedCourier) {
      return false;
    }
    if (selectedZone !== "ALL" && s.zone !== selectedZone) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.courierName.toLowerCase().includes(q) ||
        s.zoneLabel.toLowerCase().includes(q) ||
        s.weightSlab.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Tag size={18} />
            </span>
            <span>Courier Rate Slabs &amp; Pricing Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure courier base buy rates, merchant selling prices, and profit margins per zone and weight slab.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} className="text-indigo-600" />
            <span>Add Custom Slab</span>
          </button>
          <button
            type="button"
            disabled={isSavingAll}
            onClick={handleSaveAll}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSavingAll ? "Saving All Rates…" : "Save All Slabs"}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        {/* Courier Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
            <Truck size={14} className="text-indigo-600" /> Courier:
          </span>
          {[
            { id: "shadowfax", name: "Shadowfax Express (0.5kg Air)" },
            { id: "shadowfax_surface", name: "Shadowfax Cargo (7KG Plan)" },
            { id: "xpressbees", name: "Xpressbees Surface" },
            { id: "delhivery", name: "Delhivery Direct" },
            { id: "ALL", name: "All Couriers" },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCourier(c.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedCourier === c.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Zone Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Zone:</span>
            {[
              { id: "ALL", name: "All Zones" },
              { id: "ZONE_A", name: "Zone A (Local)" },
              { id: "ZONE_B", name: "Zone B (Regional)" },
              { id: "ZONE_C", name: "Zone C (Metro)" },
              { id: "ZONE_D", name: "Zone D (ROI)" },
            ].map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setSelectedZone(z.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedZone === z.id
                    ? "bg-slate-900 text-white font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {z.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search weight slab (e.g. 5kg, 1kg)…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:bg-white focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Slabs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3.5 px-4">Courier Partner</th>
                <th className="py-3.5 px-4">Shipping Zone</th>
                <th className="py-3.5 px-4">Weight Slab</th>
                <th className="py-3.5 px-4">Courier Base Cost (₹)</th>
                <th className="py-3.5 px-4">Seller Prepaid Price (₹)</th>
                <th className="py-3.5 px-4">Seller COD Price (₹)</th>
                <th className="py-3.5 px-4">Gross Platform Margin</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredSlabs.map((s) => {
                const marginPrepaid = s.userPrepaidPrice - s.courierBaseCost;
                const marginCod = s.userCodPrice - s.courierBaseCost;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.courierName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{s.courierCode}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{s.zoneLabel}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block rounded-lg bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 font-mono font-bold text-indigo-700 text-xs">
                        {s.weightSlab}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={s.courierBaseCost}
                          onChange={(e) =>
                            handleRateChange(s.id, "courierBaseCost", Number(e.target.value))
                          }
                          className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-bold text-slate-700 text-xs focus:bg-white focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={s.userPrepaidPrice}
                          onChange={(e) =>
                            handleRateChange(s.id, "userPrepaidPrice", Number(e.target.value))
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 font-bold text-slate-900 text-xs focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
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
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 font-bold text-amber-800 text-xs focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold">
                      <span className="text-emerald-700 block">
                        +{formatINR(marginPrepaid)} <span className="text-[10px] text-slate-400 font-normal">(Prepaid)</span>
                      </span>
                      <span className="text-amber-700 block text-[11px]">
                        +{formatINR(marginCod)} <span className="text-[10px] text-slate-400 font-normal">(COD)</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={savingId === s.id}
                          onClick={() => handleSaveSlab(s)}
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 shadow-xs"
                        >
                          <Save size={12} />
                          <span>{savingId === s.id ? "Saving…" : "Save"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlab(s.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete slab"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredSlabs.length && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Scale size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No Rate Slabs Match Filter</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try selecting another courier or zone tab above.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Slab Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                <Plus size={16} className="text-indigo-600" /> Add Custom Weight Slab
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Courier Partner
                </label>
                <select
                  value={newSlab.courierCode}
                  onChange={(e) =>
                    setNewSlab({
                      ...newSlab,
                      courierCode: e.target.value,
                      courierName:
                        e.target.value === "shadowfax_surface"
                          ? "Shadowfax Cargo (7KG)"
                          : e.target.value === "shadowfax"
                          ? "Shadowfax Express"
                          : e.target.value === "xpressbees"
                          ? "Xpressbees Surface"
                          : "Delhivery Direct",
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900"
                >
                  <option value="shadowfax">Shadowfax Express (0.5kg Air)</option>
                  <option value="shadowfax_surface">Shadowfax Cargo (7KG Plan)</option>
                  <option value="xpressbees">Xpressbees Surface</option>
                  <option value="delhivery">Delhivery Direct</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Shipping Zone
                  </label>
                  <select
                    value={newSlab.zone}
                    onChange={(e) => setNewSlab({ ...newSlab, zone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900"
                  >
                    <option value="ZONE_A">Zone A (Intra-City)</option>
                    <option value="ZONE_B">Zone B (Regional)</option>
                    <option value="ZONE_C">Zone C (Metro to Metro)</option>
                    <option value="ZONE_D">Zone D (Rest of India)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Weight Slab (e.g. 5kg–7kg)
                  </label>
                  <input
                    type="text"
                    value={newSlab.weightSlab}
                    onChange={(e) => setNewSlab({ ...newSlab, weightSlab: e.target.value })}
                    placeholder="2kg–5kg"
                    className="w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Courier Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={newSlab.courierBaseCost}
                    onChange={(e) => setNewSlab({ ...newSlab, courierBaseCost: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Prepaid Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newSlab.userPrepaidPrice}
                    onChange={(e) => setNewSlab({ ...newSlab, userPrepaidPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    COD Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newSlab.userCodPrice}
                    onChange={(e) => setNewSlab({ ...newSlab, userCodPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSlab}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
              >
                Add Slab to Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

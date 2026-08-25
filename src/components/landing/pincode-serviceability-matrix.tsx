"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";

interface PincodeLocationInfo {
  pincode: string;
  city: string;
  state: string;
  zone: string;
}

const POPULAR_PINCODES: PincodeLocationInfo[] = [
  { pincode: "201301", city: "Noida", state: "Uttar Pradesh", zone: "Zone A (Metro)" },
  { pincode: "110001", city: "New Delhi", state: "Delhi", zone: "Zone A (Metro)" },
  { pincode: "400001", city: "Mumbai", state: "Maharashtra", zone: "Zone A (Metro)" },
  { pincode: "560001", city: "Bengaluru", state: "Karnataka", zone: "Zone A (Metro)" },
  { pincode: "700001", city: "Kolkata", state: "West Bengal", zone: "Zone B (Regional)" },
  { pincode: "500001", city: "Hyderabad", state: "Telangana", zone: "Zone A (Metro)" },
  { pincode: "380001", city: "Ahmedabad", state: "Gujarat", zone: "Zone B (Regional)" },
  { pincode: "302001", city: "Jaipur", state: "Rajasthan", zone: "Zone B (Regional)" },
  { pincode: "800001", city: "Patna", state: "Bihar", zone: "Zone C (National)" },
  { pincode: "226001", city: "Lucknow", state: "Uttar Pradesh", zone: "Zone B (Regional)" },
];

function resolvePincodeData(pin: string): PincodeLocationInfo {
  const found = POPULAR_PINCODES.find((p) => p.pincode === pin);
  if (found) return found;

  const firstDigit = pin[0];
  let state = "India";
  let city = "Standard Delivery Hub";
  let zone = "Zone B (Regional)";

  if (firstDigit === "1") {
    state = "Delhi / Haryana / Punjab";
    city = "North Region Hub";
    zone = "Zone A (Metro)";
  } else if (firstDigit === "2") {
    state = "Uttar Pradesh / Uttarakhand";
    city = "UP Central Hub";
    zone = "Zone A (Metro)";
  } else if (firstDigit === "3") {
    state = "Gujarat / Rajasthan";
    city = "West Region Hub";
    zone = "Zone B (Regional)";
  } else if (firstDigit === "4") {
    state = "Maharashtra / Goa / MP";
    city = "West Hub";
    zone = "Zone A (Metro)";
  } else if (firstDigit === "5") {
    state = "Andhra Pradesh / Telangana / Karnataka";
    city = "South Hub";
    zone = "Zone A (Metro)";
  } else if (firstDigit === "6") {
    state = "Tamil Nadu / Kerala";
    city = "South Coast Hub";
    zone = "Zone B (Regional)";
  } else if (firstDigit === "7") {
    state = "West Bengal / Odisha / North East";
    city = "East Region Hub";
    zone = "Zone B (Regional)";
  } else if (firstDigit === "8") {
    state = "Bihar / Jharkhand";
    city = "East Central Hub";
    zone = "Zone C (National)";
  }

  return {
    pincode: pin || "110001",
    city,
    state,
    zone,
  };
}

export function PincodeServiceabilityMatrix() {
  const [inputPincode, setInputPincode] = useState("201301");
  const [activeLocation, setActiveLocation] = useState<PincodeLocationInfo>(
    resolvePincodeData("201301")
  );

  function handleCheck(pincodeToCheck?: string) {
    const target = (pincodeToCheck || inputPincode).trim();
    if (target.length === 6) {
      setActiveLocation(resolvePincodeData(target));
      if (pincodeToCheck) setInputPincode(pincodeToCheck);
    }
  }

  const courierMatrix = [
    {
      courier: "Shadowfax Express",
      badge: "Air & Hyperlocal",
      sla: "1 - 2 Days",
      prepaid: true,
      cod: true,
      pickup: true,
      reversePickup: true,
      status: "Direct Dispatch Active",
    },
    {
      courier: "Xpressbees Surface & Air",
      badge: "Pan-India Surface",
      sla: "2 - 3 Days",
      prepaid: true,
      cod: true,
      pickup: true,
      reversePickup: true,
      status: "Direct Dispatch Active",
    },
    {
      courier: "Delhivery Direct Logistics",
      badge: "Express Priority",
      sla: "1 - 2 Days",
      prepaid: true,
      cod: true,
      pickup: true,
      reversePickup: true,
      status: "Direct Dispatch Active",
    },
    {
      courier: "Ekart Logistics",
      badge: "Tier 2 & 3 Specialist",
      sla: "2 - 4 Days",
      prepaid: true,
      cod: true,
      pickup: true,
      reversePickup: true,
      status: "Network Available",
    },
    {
      courier: "Blue Dart Express",
      badge: "Premium Air Cargo",
      sla: "1 Day (Next-Day Air)",
      prepaid: true,
      cod: true,
      pickup: true,
      reversePickup: false,
      status: "Air Network Active",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search Bar & Presets */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600" />
            <input
              type="text"
              maxLength={6}
              value={inputPincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setInputPincode(val);
                if (val.length === 6) {
                  handleCheck(val);
                }
              }}
              placeholder="Enter 6-digit destination PIN code (e.g. 201301, 110001)…"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => handleCheck()}
            className="h-12 rounded-xl bg-indigo-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Search size={15} />
            <span>Check Coverage</span>
          </button>
        </div>

        {/* Popular Cities Chips */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-slate-500 mr-1">Popular Hubs:</span>
          {POPULAR_PINCODES.slice(0, 6).map((pop) => (
            <button
              key={pop.pincode}
              type="button"
              onClick={() => handleCheck(pop.pincode)}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                inputPincode === pop.pincode
                  ? "bg-indigo-600 text-white font-bold shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {pop.city} ({pop.pincode})
            </button>
          ))}
        </div>
      </div>

      {/* Live Location & Matrix Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table Header Banner */}
        <div className="bg-slate-900 p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <MapPin size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-white">
                  PIN: {activeLocation.pincode}
                </span>
                <span className="rounded bg-indigo-500/30 text-indigo-200 text-[10px] font-semibold px-2 py-0.5">
                  {activeLocation.zone}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {activeLocation.city}, {activeLocation.state} &bull; 10,000+ PIN Codes Network (2,500+ Cities)
              </p>

            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              100% Doorstep Serviceable
            </span>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3.5 px-4">Courier Partner</th>
                <th className="py-3.5 px-4">Expected Delivery SLA</th>
                <th className="py-3.5 px-4 text-center">Prepaid</th>
                <th className="py-3.5 px-4 text-center">Cash On Delivery (COD)</th>
                <th className="py-3.5 px-4 text-center">Doorstep Pickup</th>
                <th className="py-3.5 px-4 text-center">Reverse RVP</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {courierMatrix.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 text-sm">{c.courier}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{c.badge}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <Clock size={13} className="text-indigo-600 shrink-0" />
                      <span>{c.sla}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={15} />
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={15} />
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={15} />
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {c.reversePickup ? (
                      <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={15} />
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

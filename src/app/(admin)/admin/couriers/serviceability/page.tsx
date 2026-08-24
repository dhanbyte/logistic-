"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, Search, ShieldAlert, Truck, XCircle } from "lucide-react";

export default function AdminServiceabilityPage() {
  const [pincode, setPincode] = useState("201301");
  const [results, setResults] = useState([
    {
      courier: "Shadowfax Express",
      pincode: "201301",
      city: "Noida",
      state: "Uttar Pradesh",
      zone: "Zone A",
      prepaid: true,
      cod: true,
      pickup: true,
      reversePickup: true,
    },
    {
      courier: "Xpressbees Surface",
      pincode: "201301",
      city: "Noida",
      state: "Uttar Pradesh",
      zone: "Zone A",
      prepaid: true,
      cod: true,
      pickup: true,
      reversePickup: true,
    },
    {
      courier: "Delhivery Direct",
      pincode: "201301",
      city: "Noida",
      state: "Uttar Pradesh",
      zone: "Zone A",
      prepaid: true,
      cod: true,
      pickup: true,
      reversePickup: true,
    },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Pan-India Pincode Serviceability Matrix</h1>
        <p className="text-xs text-slate-500">
          Check 29,000+ Indian PIN codes, COD availability, and reverse pickup coverage by courier partner.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs max-w-md">
        <MapPin size={18} className="text-indigo-600 shrink-0" />
        <input
          type="text"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          placeholder="Enter 6-digit PIN code (e.g. 110001)…"
          className="w-full text-xs font-mono font-bold focus:outline-none"
        />
        <button className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs">
          Check
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Courier Partner</th>
              <th className="py-3 px-4">Pincode &amp; Location</th>
              <th className="py-3 px-4">Zone</th>
              <th className="py-3 px-4 text-center">Prepaid</th>
              <th className="py-3 px-4 text-center">COD</th>
              <th className="py-3 px-4 text-center">Pickup</th>
              <th className="py-3 px-4 text-center">Reverse RVP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {results.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-bold text-slate-900">{r.courier}</td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-slate-900">{r.pincode}</span> &bull; {r.city},{" "}
                  {r.state}
                </td>
                <td className="py-3 px-4 font-semibold text-indigo-700">{r.zone}</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block size-2 rounded-full bg-emerald-500"></span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block size-2 rounded-full bg-emerald-500"></span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block size-2 rounded-full bg-emerald-500"></span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block size-2 rounded-full bg-emerald-500"></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

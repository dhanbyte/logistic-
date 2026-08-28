"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  Zap,
  Building2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Package,
  XCircle,
  ShieldAlert,
} from "lucide-react";

export interface CourierServiceItem {
  courierCode: string;
  courierName: string;
  serviceType: string;
  pickupServiceable: boolean;
  deliveryServiceable: boolean;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  reversePickupAvailable: boolean;
  codFee: number;
  rtoCharge: number;
  estimatedDays: number;
  estimatedSla: string;
  status: string;
  cutoffTime?: string;
}

export interface ServiceabilityApiResponse {
  success: boolean;
  isServiceable?: boolean;
  error?: string;
  route: {
    origin: {
      pincode: string;
      isValid?: boolean;
      city: string;
      district: string;
      state: string;
      pickupServiceable: boolean;
      pickupSla: string;
      pickupCutoffTime: string;
    };
    destination: {
      pincode: string;
      isValid?: boolean;
      city: string;
      district: string;
      state: string;
      deliveryServiceable: boolean;
      deliverySla: string;
      isMetro: boolean;
    };
    zone: string;
    zoneLabel: string;
  };
  serviceability: {
    isDoorstepPickupAvailable: boolean;
    isDoorstepDeliveryAvailable: boolean;
    isCodAvailable: boolean;
    isPrepaidAvailable: boolean;
    isReversePickupAvailable: boolean;
    codCharge: number;
    rtoCharge: number;
    totalActiveCouriers: number;
  };
  couriers: CourierServiceItem[];
}

const POPULAR_HUBS = [
  { pincode: "110001", city: "New Delhi", state: "Delhi" },
  { pincode: "201301", city: "Noida", state: "Uttar Pradesh" },
  { pincode: "400001", city: "Mumbai", state: "Maharashtra" },
  { pincode: "560001", city: "Bengaluru", state: "Karnataka" },
  { pincode: "700001", city: "Kolkata", state: "West Bengal" },
  { pincode: "500001", city: "Hyderabad", state: "Telangana" },
  { pincode: "600001", city: "Chennai", state: "Tamil Nadu" },
  { pincode: "380005", city: "Ahmedabad", state: "Gujarat" },
  { pincode: "395001", city: "Surat", state: "Gujarat" },
  { pincode: "411001", city: "Pune", state: "Maharashtra" },
  { pincode: "302001", city: "Jaipur", state: "Rajasthan" },
  { pincode: "226001", city: "Lucknow", state: "Uttar Pradesh" },
  { pincode: "800001", city: "Patna", state: "Bihar" },
  { pincode: "852219", city: "Madhepura/Saharsa", state: "Bihar" },
];

export function PincodeServiceabilityMatrix() {
  const [pickupPincode, setPickupPincode] = useState("380005");
  const [deliveryPincode, setDeliveryPincode] = useState("852219");
  const [inputQuery, setInputQuery] = useState("852219");
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<ServiceabilityApiResponse | null>(null);

  async function checkServiceability(deliveryPin = inputQuery, pickupPin = pickupPincode) {
    const cleanDelivery = deliveryPin.trim().replace(/\D/g, "");
    const cleanPickup = pickupPin.trim().replace(/\D/g, "") || "380005";

    if (cleanDelivery.length !== 6) {
      if (cleanDelivery.length > 0) {
        setApiData({
          success: false,
          isServiceable: false,
          error: "Please enter a valid 6-digit Indian PIN code.",
          route: {
            origin: {
              pincode: cleanPickup,
              isValid: true,
              city: "Pickup Hub",
              district: "Pickup Area",
              state: "India",
              pickupServiceable: true,
              pickupSla: "Same-Day Pickup",
              pickupCutoffTime: "14:00 IST",
            },
            destination: {
              pincode: cleanDelivery,
              isValid: false,
              city: "Incomplete PIN",
              district: "Invalid",
              state: "Invalid",
              deliveryServiceable: false,
              deliverySla: "N/A",
              isMetro: false,
            },
            zone: "NONE",
            zoneLabel: "Invalid PIN Code Length",
          },
          serviceability: {
            isDoorstepPickupAvailable: false,
            isDoorstepDeliveryAvailable: false,
            isCodAvailable: false,
            isPrepaidAvailable: false,
            isReversePickupAvailable: false,
            codCharge: 0,
            rtoCharge: 0,
            totalActiveCouriers: 0,
          },
          couriers: [],
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/couriers/serviceability?pincode=${cleanDelivery}&pickup_pincode=${cleanPickup}`
      );
      const data = await res.json();
      setApiData(data);
      setDeliveryPincode(cleanDelivery);
      setInputQuery(cleanDelivery);
    } catch (e) {
      console.error("Failed to check pincode serviceability:", e);
    } finally {
      setIsLoading(false);
    }
  }

  // Load initial serviceability on mount
  useEffect(() => {
    checkServiceability("852219", "380005");
  }, []);

  const destination = apiData?.route?.destination;
  const origin = apiData?.route?.origin;
  const isServiceable = Boolean(apiData?.success && apiData?.isServiceable !== false);
  const zoneLabel = isServiceable ? apiData?.route?.zoneLabel || "Zone D (Rest of India)" : "Unserviceable / No Service";
  const zoneCode = isServiceable ? apiData?.route?.zone || "ZONE_D" : "NONE";
  const couriers = apiData?.couriers || [];
  const errorMessage = apiData?.error || "This PIN code is unserviceable or not recognized in the Indian Postal network.";

  return (
    <div className="space-y-6">
      {/* Search Input & Pickup Parameters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkServiceability();
          }}
          className="space-y-4"
        >
          <div className="grid sm:grid-cols-12 gap-3 items-center">
            {/* Pickup PIN Code */}
            <div className="sm:col-span-4">
              <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-emerald-500" />
                Pickup Location PIN
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={pickupPincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPickupPincode(val);
                    if (val.length === 6) {
                      checkServiceability(inputQuery, val);
                    }
                  }}
                  placeholder="e.g. 380005 (Pickup)"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            {/* Delivery PIN Code */}
            <div className="sm:col-span-5">
              <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <span className={`inline-block size-2 rounded-full ${isServiceable ? "bg-indigo-600" : "bg-rose-500"}`} />
                Destination / Delivery PIN Code
              </label>
              <div className="relative">
                <MapPin size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isServiceable ? "text-indigo-600" : "text-rose-500"}`} />
                <input
                  type="text"
                  maxLength={6}
                  value={inputQuery}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setInputQuery(val);
                    if (val.length === 6) {
                      checkServiceability(val, pickupPincode);
                    }
                  }}
                  placeholder="Enter 6-digit PIN (e.g. 852219, 380005, 110001)…"
                  className={`h-11 w-full rounded-xl border pl-9 pr-3 text-xs font-mono font-bold text-slate-900 outline-none transition-all ${
                    isServiceable
                      ? "border-slate-200 bg-slate-50/70 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      : "border-rose-300 bg-rose-50/40 text-rose-950 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  }`}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-3 pt-5 sm:pt-0">
              <button
                type="submit"
                disabled={isLoading}
                className={`h-11 w-full rounded-xl px-5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-75 ${
                  isServiceable ? "bg-indigo-600 hover:bg-indigo-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                <span>{isLoading ? "Checking Network..." : "Check Coverage"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Popular Hubs Quick Selector */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            Popular Hubs:
          </span>
          {POPULAR_HUBS.map((hub) => (
            <button
              key={hub.pincode}
              type="button"
              onClick={() => {
                setInputQuery(hub.pincode);
                checkServiceability(hub.pincode, pickupPincode);
              }}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer ${
                deliveryPincode === hub.pincode && isServiceable
                  ? "bg-indigo-600 text-white font-bold shadow-2xs scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {hub.city} ({hub.pincode})
            </button>
          ))}
        </div>
      </div>

      {/* Unserviceable Warning Banner (if invalid / no courier coverage) */}
      {!isServiceable && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 sm:p-5 shadow-xs flex items-start gap-3.5 animate-fadeIn">
          <div className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-700 shrink-0">
            <XCircle size={22} />
          </div>
          <div>
            <h4 className="text-sm font-black text-rose-950 flex items-center gap-2">
              No Courier Coverage Available for PIN: {inputQuery}
            </h4>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              {errorMessage}
            </p>
            <p className="text-[11px] text-rose-700/80 mt-1.5 font-medium">
              Tip: Please enter a valid Indian postal pincode (digits 100000–899999) or select one of our verified hubs above.
            </p>
          </div>
        </div>
      )}

      {/* 4 Verified Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Doorstep Pickup Serviceable */}
        <div className={`rounded-xl border p-4 shadow-2xs transition-colors ${
          origin?.pickupServiceable ? "border-slate-200 bg-white" : "border-rose-200 bg-rose-50/40"
        }`}>
          <div className={`flex items-center gap-2 mb-1 ${origin?.pickupServiceable ? "text-emerald-600" : "text-rose-600"}`}>
            <Package size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Pickup Status</span>
          </div>
          <p className={`text-base font-black ${origin?.pickupServiceable ? "text-emerald-700" : "text-rose-700"}`}>
            {origin?.pickupServiceable ? "✓ Pickup Available" : "❌ Unserviceable"}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            {origin?.pickupServiceable ? "Same-day Doorstep Pickup" : "No Pickup in this PIN"}
          </p>
        </div>

        {/* Zone Determination */}
        <div className={`rounded-xl border p-4 shadow-2xs transition-colors ${
          isServiceable ? "border-slate-200 bg-white" : "border-rose-200 bg-rose-50/40"
        }`}>
          <div className={`flex items-center gap-2 mb-1 ${isServiceable ? "text-indigo-600" : "text-rose-600"}`}>
            <MapPin size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Assigned Zone</span>
          </div>
          <p className={`text-base font-black ${isServiceable ? "text-slate-900" : "text-rose-700"}`}>
            {isServiceable ? zoneCode.replace("_", " ") : "NONE"}
          </p>
          <p className={`text-[10px] font-semibold mt-0.5 truncate ${isServiceable ? "text-indigo-700" : "text-rose-600"}`}>
            {zoneLabel}
          </p>
        </div>

        {/* COD Charges */}
        <div className={`rounded-xl border p-4 shadow-2xs transition-colors ${
          isServiceable ? "border-slate-200 bg-white" : "border-rose-200 bg-rose-50/40"
        }`}>
          <div className={`flex items-center gap-2 mb-1 ${isServiceable ? "text-emerald-600" : "text-rose-600"}`}>
            <ShieldCheck size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">COD Service</span>
          </div>
          <p className={`text-base font-black ${isServiceable ? "text-emerald-700" : "text-rose-700"}`}>
            {isServiceable ? "100% Available" : "❌ No COD Service"}
          </p>
          <p className={`text-[10px] font-bold mt-0.5 ${isServiceable ? "text-emerald-700" : "text-rose-600"}`}>
            {isServiceable ? "₹0 COD Surcharge" : "Service Disabled"}
          </p>
        </div>

        {/* SLA & RTO */}
        <div className={`rounded-xl border p-4 shadow-2xs transition-colors ${
          isServiceable ? "border-slate-200 bg-white" : "border-rose-200 bg-rose-50/40"
        }`}>
          <div className={`flex items-center gap-2 mb-1 ${isServiceable ? "text-purple-600" : "text-rose-600"}`}>
            <Clock size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Expected SLA</span>
          </div>
          <p className={`text-base font-black ${isServiceable ? "text-slate-900" : "text-rose-700"}`}>
            {isServiceable ? destination?.deliverySla || "2 - 3 Days" : "—"}
          </p>
          <p className={`text-[10px] font-bold mt-0.5 ${isServiceable ? "text-emerald-600" : "text-rose-600"}`}>
            {isServiceable ? "100% Free RTO" : "No Delivery Route"}
          </p>
        </div>
      </div>

      {/* Main Location & Courier Serviceability Table */}
      <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${
        isServiceable ? "border-slate-200" : "border-rose-200"
      }`}>
        {/* Table Header Banner */}
        <div className={`p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isServiceable ? "bg-slate-900" : "bg-rose-950"
        }`}>
          <div className="flex items-start sm:items-center gap-3">
            <span className={`grid size-10 place-items-center rounded-xl border shrink-0 ${
              isServiceable ? "bg-indigo-500/20 border-indigo-400/30 text-indigo-300" : "bg-rose-500/20 border-rose-400/30 text-rose-300"
            }`}>
              <MapPin size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-black text-base sm:text-lg text-white tracking-wide">
                  Route: {pickupPincode} &rarr; {deliveryPincode}
                </span>
                <span className={`rounded-md border text-[10px] font-bold px-2 py-0.5 ${
                  isServiceable
                    ? "bg-indigo-500/30 border-indigo-400/30 text-indigo-200"
                    : "bg-rose-500/30 border-rose-400/30 text-rose-200"
                }`}>
                  {zoneLabel}
                </span>
                {destination?.isMetro && isServiceable && (
                  <span className="rounded-md bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5">
                    ★ Metro Destination
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isServiceable ? (
                  <>
                    From <strong>{origin?.district || origin?.city || "Origin"} ({origin?.state || "India"})</strong> to{" "}
                    <strong>{destination?.district || destination?.city || "Destination"} ({destination?.state || "India"})</strong>
                  </>
                ) : (
                  <span className="text-rose-200 font-semibold">
                    Delivery PIN {deliveryPincode} is not recognized or unserviceable.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isServiceable ? (
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                100% Serviceable Route
              </span>
            ) : (
              <span className="rounded-full bg-rose-500/30 border border-rose-400/40 px-3.5 py-1 text-xs font-bold text-rose-200 flex items-center gap-1.5">
                <XCircle size={14} className="text-rose-400" />
                Unserviceable / No Route
              </span>
            )}
          </div>
        </div>

        {/* Courier Matrix Table / Empty Unserviceable State */}
        {isServiceable && couriers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Courier Partner</th>
                  <th className="py-3.5 px-4">Service Type</th>
                  <th className="py-3.5 px-4">Delivery SLA</th>
                  <th className="py-3.5 px-4 text-center">Doorstep Pickup</th>
                  <th className="py-3.5 px-4 text-center">Prepaid</th>
                  <th className="py-3.5 px-4 text-center">COD (₹0 Fee)</th>
                  <th className="py-3.5 px-4 text-center">Reverse RVP</th>
                  <th className="py-3.5 px-4 text-right">Route Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {couriers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{c.courierName}</p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {c.cutoffTime ? `Cutoff: ${c.cutoffTime}` : "Daily Dispatch"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {c.serviceType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Clock size={13} className="text-indigo-600 shrink-0" />
                        <span>{c.estimatedSla}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          <CheckCircle2 size={15} />
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 mt-0.5">Active</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                        <CheckCircle2 size={15} />
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          <CheckCircle2 size={15} />
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 mt-0.5">₹0 Fee</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {c.reversePickupAvailable ? (
                        <div className="flex flex-col items-center">
                          <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                            <CheckCircle2 size={15} />
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 mt-0.5">Free RTO</span>
                        </div>
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
        ) : (
          <div className="p-8 sm:p-12 text-center bg-white space-y-3">
            <div className="mx-auto size-12 rounded-2xl bg-rose-100 text-rose-600 grid place-items-center mb-2">
              <ShieldAlert size={26} />
            </div>
            <h4 className="text-base font-black text-slate-900">
              No Courier Coverage for Destination PIN: {deliveryPincode}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              This PIN code does not exist in the Indian Postal network or has no active courier hubs for doorstep delivery.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setInputQuery("852219");
                  checkServiceability("852219", pickupPincode);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
              >
                Reset to Valid PIN (e.g. 852219)
              </button>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="bg-slate-50/70 p-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>
            * Live verified Indian Postal PIN database with Doorstep Pickup, Route Zone Matching &amp; 100% Free RTO.
          </span>
          <span className="font-semibold text-indigo-600 flex items-center gap-1">
            <Zap size={12} /> Active Integrated Couriers
          </span>
        </div>
      </div>
    </div>
  );
}

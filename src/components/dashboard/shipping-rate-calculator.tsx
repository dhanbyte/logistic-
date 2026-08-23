"use client";

import { useState } from "react";
import { Calculator, Check, Sparkles, Truck } from "lucide-react";
import { calculateChargeableWeight, formatINR } from "@/lib/calculations";
import { compareAllCourierRates } from "@/lib/couriers/registry";
import type { CourierRateQuote } from "@/lib/couriers/types";

export function ShippingRateCalculator() {
  const [pickupPincode, setPickupPincode] = useState("110020");
  const [deliveryPincode, setDeliveryPincode] = useState("400050");
  const [weightKg, setWeightKg] = useState("0.5");
  const [lengthCm, setLengthCm] = useState("15");
  const [widthCm, setWidthCm] = useState("10");
  const [heightCm, setHeightCm] = useState("8");
  const [paymentMode, setPaymentMode] = useState<"PREPAID" | "COD">("PREPAID");
  const [codAmount, setCodAmount] = useState("1499");
  const [quotes, setQuotes] = useState<CourierRateQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const weightCalc = calculateChargeableWeight(Number(weightKg) || 0.5, {
      lengthCm: Number(lengthCm) || 10,
      widthCm: Number(widthCm) || 10,
      heightCm: Number(heightCm) || 10,
    });

    const results = await compareAllCourierRates(
      {
        pickupPincode,
        deliveryPincode,
        weightKg: weightCalc.chargeableWeightKg,
        paymentMode,
        declaredValue: Number(codAmount) || 0,
      },
      weightCalc,
    );

    setQuotes(results);
    setCalculated(true);
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <Calculator size={18} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            Live Shipping Rate Calculator
          </h3>
          <p className="text-xs text-slate-500">
            Compare real-time shipping costs across all Indian courier partners
          </p>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Pickup PIN</label>
            <input
              type="text"
              required
              maxLength={6}
              value={pickupPincode}
              onChange={(e) => setPickupPincode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-600 focus:outline-none"
              placeholder="e.g. 110020"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Delivery PIN</label>
            <input
              type="text"
              required
              maxLength={6}
              value={deliveryPincode}
              onChange={(e) => setDeliveryPincode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-600 focus:outline-none"
              placeholder="e.g. 560001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Dead Weight (kg)</label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="PREPAID">Prepaid</option>
              <option value="COD">Cash on Delivery (COD)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500">Length (cm)</label>
            <input
              type="number"
              min="1"
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500">Width (cm)</label>
            <input
              type="number"
              min="1"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500">Height (cm)</label>
            <input
              type="number"
              min="1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          {loading ? "Calculating Live Quotes…" : "Check Rates across 6 Courier Partners"}
        </button>
      </form>

      {calculated && quotes.length > 0 && (
        <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Available Courier Partners ({quotes[0].zone.replace("_", " ")})
            </span>
            <span className="text-xs text-slate-500">
              Chargeable: <strong className="text-slate-800">{quotes[0].chargeableWeightKg} kg</strong>
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {quotes.map((quote, idx) => (
              <div
                key={quote.courierCode}
                className={`relative rounded-lg border p-3 transition-all ${
                  idx === 0
                    ? "border-indigo-400 bg-indigo-50/50 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {idx === 0 && (
                  <span className="absolute -top-2 right-2 flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    <Sparkles size={10} /> Cheapest
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{quote.courierName}</h4>
                    <p className="text-xs text-slate-500">Est. delivery: {quote.estimatedDeliveryDays} days</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900">
                      {formatINR(quote.totalShippingCost)}
                    </span>
                    <p className="text-[10px] text-slate-400">incl. 18% GST</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-1.5">
                  <span>Freight: {formatINR(quote.freightCharge)}</span>
                  {quote.codCharge > 0 && <span>COD: {formatINR(quote.codCharge)}</span>}
                  <span className="font-semibold text-amber-700">★ {quote.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

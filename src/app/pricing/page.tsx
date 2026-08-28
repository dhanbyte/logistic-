"use client";

import { useState } from "react";
import Link from "next/link";
import { PincodeServiceabilityMatrix } from "@/components/landing/pincode-serviceability-matrix";
import {
  Truck,
  CheckCircle2,
  Calculator,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingDown,
  Clock,
  Sparkles,
  HelpCircle,
  Percent,
} from "lucide-react";

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);
}

export default function PricingPage() {
  const [pickupPincode, setPickupPincode] = useState("110020");
  const [deliveryPincode, setDeliveryPincode] = useState("400001");
  const [weightKg, setWeightKg] = useState("0.5");
  const [paymentMode, setPaymentMode] = useState<"PREPAID" | "COD">("PREPAID");

  const weight = Math.max(0.1, parseFloat(weightKg) || 0.5);
  const codFee = 0;

  // 1. Shadowfax Express (0.5kg Air Plan)
  const baseShadowfaxExpress = weight <= 0.5 ? 78 : 78 + Math.ceil((weight - 0.5) / 0.5) * 45;
  const shadowfaxExpressRate = baseShadowfaxExpress;

  // 2. Shadowfax Cargo (7KG Surface Plan)
  let baseCargoRate = 96;
  if (weight <= 1.0) {
    baseCargoRate = 96;
  } else if (weight <= 3.0) {
    baseCargoRate = 126;
  } else if (weight <= 5.0) {
    baseCargoRate = 146;
  } else if (weight <= 7.0) {
    baseCargoRate = 166;
  } else {
    baseCargoRate = 166 + Math.ceil(weight - 7.0) * 20;
  }
  const shadowfaxCargoRate = baseCargoRate;

  // 3. Xpressbees Surface
  const baseXpressbees = Math.round(98 + (weight > 0.5 ? Math.ceil((weight - 0.5) / 0.5) * 40 : 0));
  const xpressbeesRate = baseXpressbees;

  // 4. Delhivery Direct
  const baseDelhivery = Math.round(110 + (weight > 0.5 ? Math.ceil((weight - 0.5) / 0.5) * 45 : 0));
  const delhiveryRate = baseDelhivery;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white font-sans flex flex-col justify-between">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Truck size={20} />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                Shipwave
              </span>
              <span className="text-[9px] font-semibold text-indigo-600 tracking-wider uppercase">
                Logistics OS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs"
            >
              <span>Rates (From ₹78)</span>
              <span className="rounded bg-emerald-600 text-[9px] font-black text-white px-1.5 py-0.2">
                ₹0 RTO
              </span>
            </Link>
            <Link href="/#platform" className="hover:text-slate-900 transition-colors">
              Platform
            </Link>
            <Link href="/pricing" className="text-indigo-600 font-bold transition-colors">
              Pricing
            </Link>
            <Link href="/#tracking" className="hover:text-slate-900 transition-colors">
              Track shipment
            </Link>
            <Link href="/blog" className="hover:text-slate-900 transition-colors">
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all hover:scale-[1.02]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. PRICING HERO */}
      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-16 sm:pb-20 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1 text-xs font-bold text-indigo-700 mb-4">
            <Sparkles size={14} />
            <span>100% Transparent Logistics Pricing &bull; Zero Hidden Costs</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Simple, Flat Shipping Rates with <span className="text-indigo-600">₹0 RTO Charges</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Pay only for successful deliveries. Experience instant courier rate transparency, guaranteed ₹0 Return-to-Origin penalties, and automated T+3 COD settlements.
          </p>

          <div className="mt-8 flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" /> ₹0 Monthly Subscription
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" /> ₹0 Minimum Shipment Limit
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" /> 29,000+ PIN Codes Covered
            </span>
          </div>
        </div>
      </section>

      {/* 3. TIER PLANS OVERVIEW */}
      <section className="py-12 sm:py-16 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-1">
              Tier Breakdown
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Pick the Perfect Plan for Your Order Volume
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Standard Tier */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Starter / Growth
                </span>
                <h3 className="text-xl font-black text-slate-900">Standard Tier</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹78</span>
                  <span className="text-xs text-slate-500">/ 500g Air base</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Best for D2C brands &amp; growing ecommerce businesses shipping 0–500 orders/month.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Shadowfax 0.5kg Air: <strong>₹78 flat</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Shadowfax 1kg–7kg Cargo: <strong>From ₹96 flat</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>100% Free RTO</strong> protection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>₹0 COD Fee</strong> (100% Free COD Processing)</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 block text-center rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-2xs"
              >
                Start with Standard
              </Link>
            </div>

            {/* Silver Tier */}
            <div className="rounded-2xl border-2 border-indigo-600 bg-white p-6 shadow-md relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 shadow-sm">
                Most Popular
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  High Volume Sellers
                </span>
                <h3 className="text-xl font-black text-slate-900">Silver Tier</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-indigo-950">₹68</span>
                  <span className="text-xs text-slate-500">/ 500g Air base</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  For merchants processing 500–2,500 orders/month seeking lower freight deductions.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Discounted Air rates (up to 15% off)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Cargo slab discounts on 3kg–7kg</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>₹0 RTO Guarantee</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>₹0 COD Fee</strong> &amp; Same-day Remittance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Priority webhook &amp; API access</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 block text-center rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs hover:scale-[1.01]"
              >
                Unlock Silver Rates
              </Link>
            </div>

            {/* Gold Tier */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Enterprise Logistics
                </span>
                <h3 className="text-xl font-black text-slate-900">Gold Tier</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">Custom</span>
                  <span className="text-xs text-slate-500">/ Custom SLA</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  For enterprises shipping 2,500+ orders/month with tailored courier routing.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Ultra-low rates from ₹58/slab</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Dedicated Key Account Manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Custom COD remittance cycle (T+1/T+2)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Lowest COD: ₹15 / 1.2%</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 block text-center rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-2xs"
              >
                Contact for Enterprise
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE RATE CALCULATOR */}
      <section id="calculator" className="py-14 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-1">
              Live Calculator
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Calculate Exact Freight Rates
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Select origin, destination and weight parameters to simulate exact courier charges.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            {/* Input Form */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                <Calculator size={16} className="text-indigo-600" /> Route &amp; Weight Parameters
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Pickup PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value)}
                    placeholder="110020"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Delivery PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={deliveryPincode}
                    onChange={(e) => setDeliveryPincode(e.target.value)}
                    placeholder="400001"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Parcel Weight (KG)
                </label>
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                  {["0.5", "1.0", "2.0", "3.0", "5.0", "7.0"].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeightKg(w)}
                      className={`rounded-lg py-1.5 text-xs font-bold border cursor-pointer ${
                        weightKg === w
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">Custom weight:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="Enter custom kg"
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("PREPAID")}
                    className={`rounded-lg py-2 text-xs font-bold border cursor-pointer ${
                      paymentMode === "PREPAID"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Prepaid (0% COD Fee)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("COD")}
                    className={`rounded-lg py-2 text-xs font-bold border cursor-pointer ${
                      paymentMode === "COD"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    COD (₹0 COD Fee • Free COD)
                  </button>
                </div>
              </div>
            </div>

            {/* Courier Comparison Results */}
            <div className="lg:col-span-7 space-y-3">
              {/* Payment Mode Status Indicator */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-emerald-500" />
                  {paymentMode === "COD"
                    ? "COD Mode Active: ₹0 COD Fee (100% Free COD for All Merchants)"
                    : "Prepaid Mode Active: Pure Freight Rate (0% COD Fee)"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white border border-emerald-200 rounded px-2 py-0.5">
                  ₹0 COD Fee
                </span>
              </div>

              {/* Shadowfax Cargo */}
              <div
                className={`rounded-2xl border p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all ${
                  weight > 0.5
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Shadowfax Cargo (7KG Surface)
                    </span>
                    <span className="rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2">
                      {weight > 0.5 ? "★ Best for Heavy" : "Flat Slab"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    1kg–7kg Flat Surface Plan &bull; SLA: 3-4 Days &bull; 100% Pan India
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-indigo-950">
                    {formatINR(shadowfaxCargoRate)}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-emerald-700">
                      ₹0 COD Fee &bull; Flat Rate
                    </span>
                    <span className="text-[10px] text-slate-400">+ 18% GST</span>
                  </div>
                </div>
              </div>

              {/* Shadowfax Express */}
              <div
                className={`rounded-2xl border p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all ${
                  weight <= 0.5
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Shadowfax Express (0.5KG Air)
                    </span>
                    <span className="rounded bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold px-1.5 py-0.2">
                      {weight <= 0.5 ? "★ Best for 0–500g" : "Fastest Air"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fast Air Express SLA: 2-3 Days &bull; Perfect for lightweight items
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    {formatINR(shadowfaxExpressRate)}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-emerald-700">
                      ₹0 COD Fee &bull; Flat Rate
                    </span>
                    <span className="text-[10px] text-slate-400">+ 18% GST</span>
                  </div>
                </div>
              </div>

              {/* Xpressbees Surface */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Xpressbees Surface</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    SLA: 2-4 Days &bull; High Reliability Surface Logistics
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    {formatINR(xpressbeesRate)}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-emerald-700">
                      ₹0 COD Fee &bull; Flat Rate
                    </span>
                    <span className="text-[10px] text-slate-400">+ 18% GST</span>
                  </div>
                </div>
              </div>

              {/* Delhivery */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Delhivery Direct</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    SLA: 2-3 Days &bull; 10,000+ PIN Coverage
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    {formatINR(delhiveryRate)}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-emerald-700">
                      ₹0 COD Fee &bull; Flat Rate
                    </span>
                    <span className="text-[10px] text-slate-400">+ 18% GST</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. OFFICIAL RATE CARD SLABS TABLE */}
      <section className="py-14 sm:py-20 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white text-xs">
                    ₹
                  </span>
                  Official Shipping Rate Card &amp; Weight Slabs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard national merchant rates across all shipping zones in India (₹0 COD fee &bull; 100% Free COD).
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2.5 py-1 w-fit">
                ✓ Verified Flat Slabs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600">
                    <th className="px-4 py-3">Weight Slab</th>
                    <th className="px-4 py-3">Recommended Partner</th>
                    <th className="px-4 py-3">Service Type</th>
                    <th className="px-4 py-3">Prepaid Price</th>
                    <th className="px-4 py-3">COD Price (₹0 Fee)</th>
                    <th className="px-4 py-3">RTO Cost</th>
                    <th className="px-4 py-3">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">0.0 kg – 0.5 kg</td>
                    <td className="px-4 py-3.5">Shadowfax Express</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold">
                        Air Express
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-emerald-700">₹78.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">₹78.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">₹0 (Free)</td>
                    <td className="px-4 py-3.5 text-slate-500">2-3 Days</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">0.5 kg – 1.0 kg</td>
                    <td className="px-4 py-3.5">Shadowfax Cargo</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold">
                        Surface Flat
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900">₹96.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">₹96.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">₹0 (Free)</td>
                    <td className="px-4 py-3.5 text-slate-500">3-4 Days</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">1.0 kg – 3.0 kg</td>
                    <td className="px-4 py-3.5">Shadowfax Cargo (3KG Plan)</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold">
                        Surface Flat
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900">₹126.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">₹126.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">₹0 (Free)</td>
                    <td className="px-4 py-3.5 text-slate-500">3-4 Days</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">3.0 kg – 5.0 kg</td>
                    <td className="px-4 py-3.5">Shadowfax Cargo (5KG Plan)</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold">
                        Surface Flat
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900">₹146.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">₹146.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">₹0 (Free)</td>
                    <td className="px-4 py-3.5 text-slate-500">3-4 Days</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">5.0 kg – 7.0 kg</td>
                    <td className="px-4 py-3.5">Shadowfax Cargo (7KG Plan)</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold">
                        Surface Flat
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900">₹166.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">₹166.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">₹0 (Free)</td>
                    <td className="px-4 py-3.5 text-slate-500">3-4 Days</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">0.0 kg – 0.5 kg (Surface)</td>
                    <td className="px-4 py-3.5">Xpressbees Surface</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold">
                        Surface 500g
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900">₹98.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">₹98.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">₹0 (Free)</td>
                    <td className="px-4 py-3.5 text-slate-500">2-4 Days</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">0.0 kg – 0.5 kg (Direct)</td>
                    <td className="px-4 py-3.5">Delhivery Direct</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-semibold">
                        Direct Express
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900">₹110.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">₹110.00</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">₹0 (Free)</td>
                    <td className="px-4 py-3.5 text-slate-500">2-3 Days</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">Additional Per KG (&gt;7kg)</td>
                    <td className="px-4 py-3.5">Surface Heavy Freight</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[10px] font-semibold">
                        Surface
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-indigo-700">+₹20.00 / kg</td>
                    <td className="px-4 py-3.5 font-bold text-indigo-700">+₹20.00 / kg</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">₹0 (Free)</td>
                    <td className="px-4 py-3.5 text-slate-500">3-5 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">
              * Note: All prices exclude 18% GST. ₹0 COD collection fee — zero extra charge for COD orders. 100% Free RTO on returned shipments.
            </p>
          </div>
        </div>
      </section>

      {/* 6. ZERO RTO & VALUE PROPOSITIONS */}
      <section className="py-14 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 mb-4">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">
                100% Zero RTO Charges
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                If a customer refuses delivery or the order is returned, you never pay extra reverse shipping charges. Your margins stay safeguarded.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
              <div className="grid size-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700 mb-4">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">
                T+3 COD Remittances
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated bank transfers within 3 business days of delivery. Keep your ecommerce cash flow healthy with direct UPI and NEFT settlements.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
              <div className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700 mb-4">
                <Zap size={20} />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">
                Zero Monthly Subscription
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No upfront software charges, recurring monthly commitments, or minimum volume penalties. Top up your wallet and pay per shipment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PINCODE SERVICEABILITY MATRIX */}
      <section id="serviceability" className="py-14 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-2">
              Pan-India Serviceability Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Check Pincode Serviceability &amp; Zones
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Live API validation across 10,000+ PIN codes with Doorstep Pickup, Delivery SLAs, and ₹0 COD verification.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <PincodeServiceabilityMatrix />
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-14 sm:py-20 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-1">
              Questions &amp; Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Pricing FAQs
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle size={16} className="text-indigo-600 shrink-0" />
                Are there any hidden charges or onboarding fees?
              </h4>
              <p className="text-xs text-slate-600 pl-6">
                No. Account setup, Shopify/WooCommerce store integration, NDR management, and webhook APIs are 100% free. You only pay for freight consumed per shipment.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle size={16} className="text-indigo-600 shrink-0" />
                How does the ₹0 RTO guarantee work?
              </h4>
              <p className="text-xs text-slate-600 pl-6">
                When an order fails delivery after 3 re-attempts and returns to your pickup address, Shipwave does not charge any return freight penalties. You only pay the standard forward shipping rate.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle size={16} className="text-indigo-600 shrink-0" />
                When do I receive my COD money in my bank account?
              </h4>
              <p className="text-xs text-slate-600 pl-6">
                COD collections are automatically reconciled and disbursed into your verified bank account on a strict T+3 schedule (3 business days after delivery confirmation).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. BOTTOM CTA */}
      <section className="py-16 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to cut shipping costs starting at ₹78?
          </h2>
          <p className="mt-3 text-sm text-indigo-200 max-w-xl mx-auto">
            Create your free account today and start shipping with India&apos;s leading courier network.
          </p>
          <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition-all hover:scale-105"
            >
              <span>Get Started for Free</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-indigo-400/40 bg-white/10 backdrop-blur-xs px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-indigo-600 text-white">
              <Truck size={14} />
            </span>
            <span className="text-xs font-black tracking-tight text-slate-900">
              Shipwave Logistics OS
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} Shipwave India. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <Link href="/pricing" className="text-indigo-600 font-bold transition-colors">
              Pricing (From ₹78)
            </Link>
            <Link href="/#platform" className="hover:text-slate-900 transition-colors">
              Platform
            </Link>
            <Link href="/#tracking" className="hover:text-slate-900 transition-colors">
              Track shipment
            </Link>
            <Link href="/blog" className="hover:text-slate-900 transition-colors">
              Blog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

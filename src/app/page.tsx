"use client";

import { Suspense, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  CreditCard,
  ExternalLink,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { formatINR } from "@/lib/calculations";
import { PincodeServiceabilityMatrix } from "@/components/landing/pincode-serviceability-matrix";
import { BLOG_POSTS } from "@/lib/blog-data";


// Real Live Public Tracking Interface
interface PublicLiveTrackingRecord {
  awbNumber: string;
  orderNumber?: string;
  courierName: string;
  courierCode: string;
  currentStatus: string;
  currentStatusText: string;
  currentStatusColor: string;
  currentLocation: string;
  originCity: string;
  originPincode: string;
  destinationCity: string;
  destinationState: string;
  destinationPincode: string;
  recipientName: string;
  pickupScheduledDate: string;
  estimatedDeliveryDate: string;
  milestones: { label: string; sublabel: string; status: "completed" | "current" | "upcoming"; timestamp?: string; location?: string }[];
  checkpoints: { status: string; activity: string; location: string; timestamp: string }[];
}

export default function LandingPage() {
  // Auth card mode
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  // Refs for smooth scroll & focus
  const trackingInputRef = useRef<HTMLInputElement>(null);
  const authCardRef = useRef<HTMLDivElement>(null);

  // Active info modal state
  const [activeModal, setActiveModal] = useState<"about" | "contact" | "terms" | "privacy" | null>(null);

  // Public Tracking State (100% Real Live Database & Courier Network)
  const [trackingAwb, setTrackingAwb] = useState("");
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [searchedRecord, setSearchedRecord] = useState<PublicLiveTrackingRecord | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [searchedAwb, setSearchedAwb] = useState("");

  // Rate Calculator State
  const [pickupPincode, setPickupPincode] = useState("110020");
  const [deliveryPincode, setDeliveryPincode] = useState("400001");
  const [weightKg, setWeightKg] = useState("0.5");
  const [paymentMode, setPaymentMode] = useState<"PREPAID" | "COD">("PREPAID");

  // Rate calculation estimates (₹0 COD Fee - Free COD for all merchants)
  const weight = Math.max(0.1, Number(weightKg) || 0.5);
  const codFee = 0;

  // 1. Shadowfax Express (0.5kg Air Plan @ ₹72 Flat)
  const baseShadowfaxExpress = weight <= 0.5 ? 72 : 72 + Math.ceil((weight - 0.5) / 0.5) * 45;
  const shadowfaxExpressRate = baseShadowfaxExpress;

  // 2. Shadowfax Cargo (1kg–6kg Flat Surface Plan @ ₹99 Flat, >6kg: +₹20/kg)
  let baseCargoRate = 99;
  if (weight <= 6.0) {
    baseCargoRate = 99;
  } else {
    baseCargoRate = 99 + Math.ceil(weight - 6.0) * 20;
  }
  const shadowfaxCargoRate = baseCargoRate;

  // 3. Xpressbees Surface
  const baseXpressbees = Math.round(98 + (weight > 0.5 ? Math.ceil((weight - 0.5) / 0.5) * 40 : 0));
  const xpressbeesRate = baseXpressbees;

  // 4. Delhivery Direct
  const baseDelhivery = Math.round(110 + (weight > 0.5 ? Math.ceil((weight - 0.5) / 0.5) * 45 : 0));
  const delhiveryRate = baseDelhivery;

  async function handleTrackSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = trackingAwb.trim().toUpperCase();
    if (!query) {
      setTrackingError("Please enter a valid AWB number or tracking ID.");
      return;
    }

    setIsTrackingLoading(true);
    setTrackingError("");
    setSearchedRecord(null);
    setSearchedAwb(query);

    try {
      const res = await fetch(`/api/track?awb=${encodeURIComponent(query)}`);
      const result = await res.json();

      if (result.found && result.data && !result.data.isNotFound) {
        setSearchedRecord(result.data);
      } else {
        setTrackingError(
          result.error ||
          `No active shipment found for AWB ${query}. Please verify the tracking number.`
        );
      }
    } catch (err) {
      console.error("Failed to fetch live tracking:", err);
      setTrackingError("Unable to connect to courier tracking gateway. Please try again in a moment.");
    } finally {
      setIsTrackingLoading(false);
    }
  }

  // Smooth scroll & actions
  function scrollToTracking() {
    const el = document.getElementById("tracking");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        trackingInputRef.current?.focus();
      }, 400);
    }
  }

  function scrollToAuth(mode: "login" | "register") {
    setAuthMode(mode);
    const el = document.getElementById("access");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white font-sans">
      {/* 1. STICKY TOP NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
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

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => scrollToSection("rates")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer shadow-2xs"
            >
              <span>Pricing (From ₹72)</span>
              <span className="rounded bg-emerald-600 text-[9px] font-black text-white px-1.5 py-0.2">
                ₹0 RTO
              </span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("serviceability")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Coverage
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("rates")}
              className="hover:text-slate-900 transition-colors cursor-pointer font-medium"
            >
              Rate Card
            </button>
            <button
              type="button"
              onClick={scrollToTracking}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Track shipment
            </button>
            <Link
              href="/blog"
              className="hover:text-slate-900 transition-colors"
            >
              Blog
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("rates")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Rate Calculator
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("serviceability")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              PIN Serviceability
            </button>
          </nav>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors cursor-pointer"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH WATERMARK & AUTH CARD */}
      <section id="access" className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24">
        {/* Subtle Watermarked Background Text */}
        <div className="pointer-events-none absolute -left-10 top-6 select-none text-[120px] sm:text-[200px] font-black tracking-tighter text-slate-200/40 leading-none z-0">
          SHIPWAVE
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Hero Typography & Value Proposition */}
            <div className="lg:col-span-7 space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span>Logistics operations, brought into focus</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
                Run every shipment with clarity.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Keep orders, courier movement, public tracking, and finance in one calm operating workspace built for growing logistics teams.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <span>Start with Shipwave</span>
                  <ArrowRight size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToSection("rates")}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-5 py-3 text-xs sm:text-sm font-bold text-indigo-700 hover:bg-indigo-100 shadow-xs transition-colors cursor-pointer"
                >
                  <span>View Rate Card (From ₹72)</span>
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={scrollToTracking}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
                >
                  <Compass size={15} className="text-indigo-600" />
                  <span>Track a shipment</span>
                </button>
              </div>

              {/* High Impact ₹0 RTO & Price Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-2xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-600" /> ₹0 RTO Charges
                  </span>
                  <p className="text-xs font-black text-emerald-950 mt-0.5">
                    100% Free RTO Returns
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 shadow-2xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                    <Zap size={13} className="text-indigo-600" /> 0.5kg Air Lite
                  </span>
                  <p className="text-xs font-black text-indigo-950 mt-0.5">
                    Starts @ ₹72.00 Flat
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-xl border border-blue-200 bg-blue-50/80 p-3 shadow-2xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1">
                    <Package size={13} className="text-blue-600" /> 1kg–6kg Cargo Plan
                  </span>
                  <p className="text-xs font-black text-blue-950 mt-0.5">
                    Starts @ ₹99.00 Flat
                  </p>
                </div>
              </div>

              {/* Courier Partners List */}
              <div className="pt-4 border-t border-slate-200/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Unified Indian Courier Engine
                </p>
                <p className="text-xs font-medium text-slate-600 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">Shadowfax Express</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800">Shadowfax Cargo (1kg–6kg)</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800">Xpressbees</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800">Delhivery</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800">Blue Dart</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800">DTDC</span>
                </p>
              </div>
            </div>

            {/* Right Column: Interactive Clean Auth Card */}
            <div ref={authCardRef} className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/70">
                <div className="mb-5">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {authMode === "register" ? "Create your account" : "Welcome back"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {authMode === "register"
                      ? "Start managing your logistics in minutes."
                      : "Sign in to your Shipwave seller dashboard."}
                  </p>
                </div>

                <Suspense fallback={<div className="py-8 text-center text-xs text-slate-400">Loading portal…</div>}>
                  <AuthForm
                    mode={authMode}
                    onModeChange={(m) => setAuthMode(m)}
                    showModeToggle={true}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 INSTANT RATE CARD & ZERO RTO STRIP */}
      <section className="bg-slate-900 text-white py-6 border-y border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-indigo-500 text-white font-black text-sm">
                ₹
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Direct Courier Rates &amp; Zero RTO Plans
                  </h3>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black px-2 py-0.5">
                    ₹0 RTO GUARANTEED
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Flat national rates with zero return charges &amp; T+2 COD bank settlements.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 flex items-center gap-2">
                <span className="text-slate-400">500g Air:</span>
                <strong className="text-emerald-400 text-sm">₹72.00</strong>
              </div>
              <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 flex items-center gap-2">
                <span className="text-slate-400">1kg–6kg Cargo (Flat):</span>
                <strong className="text-indigo-300 text-sm">₹99.00</strong>
              </div>
              <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 flex items-center gap-2">
                <span className="text-slate-400">Above 6kg:</span>
                <strong className="text-indigo-300 text-sm">+₹20/kg</strong>
              </div>

              <button
                type="button"
                onClick={() => scrollToSection("rates")}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 ml-auto sm:ml-0"
              >
                <span>Full Rate Table</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PUBLIC TRACKING SECTION */}
      <section id="tracking" className="py-16 sm:py-24 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-2">
              Public tracking
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Follow a shipment without signing in.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              Enter an AWB to see a privacy-safe delivery summary. Your reference stays in this page&apos;s memory only and is cleared from the field after submission.
            </p>
          </div>

          {/* Tracking Search Input Card */}
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  ref={trackingInputRef}
                  type="text"
                  value={trackingAwb}
                  onChange={(e) => {
                    setTrackingAwb(e.target.value);
                    if (trackingError) setTrackingError("");
                  }}
                  placeholder="Enter your AWB / Tracking ID (e.g. SFX10293847, DLV84920193)"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-4 pr-10 text-xs sm:text-sm font-medium outline-none shadow-xs transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
                <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button
                type="submit"
                disabled={isTrackingLoading}
                className="h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer shrink-0 disabled:opacity-70"
              >
                {isTrackingLoading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Track shipment</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {trackingError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
                <p className="text-xs font-bold text-rose-800">
                  {trackingError}
                </p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  Ensure you have typed the exact AWB number from your SMS notification or seller order slip.
                </p>
              </div>
            )}
          </div>

          {/* Live Real Tracking Result View */}
          {searchedRecord && (
            <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">AWB:</span>
                    <span className="font-mono text-base font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {searchedRecord.awbNumber}
                    </span>
                    <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                      {searchedRecord.courierName}
                    </span>
                    {searchedRecord.orderNumber && (
                      <span className="text-xs font-medium text-slate-500">
                        Ref: {searchedRecord.orderNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Current Location: <strong className="text-slate-900">{searchedRecord.currentLocation}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border ${searchedRecord.currentStatusColor}`}>
                    <span className="size-2 rounded-full bg-current animate-pulse" />
                    {searchedRecord.currentStatusText}
                  </span>
                </div>
              </div>

              {/* Route Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Origin Dispatch
                  </span>
                  <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                    {searchedRecord.originCity} ({searchedRecord.originPincode})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Destination &amp; Estimated Delivery
                  </span>
                  <span className="text-xs font-semibold text-indigo-700 block mt-0.5">
                    {searchedRecord.destinationCity} {searchedRecord.destinationState && `(${searchedRecord.destinationState})`} &bull; Est. {searchedRecord.estimatedDeliveryDate}
                  </span>
                </div>
              </div>

              {/* 5-Stage Stepper */}
              {searchedRecord.milestones && searchedRecord.milestones.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                    Delivery Milestones
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    {searchedRecord.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-2.5 transition-all ${
                          m.status === "completed"
                            ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                            : m.status === "current"
                            ? "border-indigo-300 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-200"
                            : "border-slate-100 bg-slate-50 text-slate-400"
                        }`}
                      >
                        <div className={`mx-auto size-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1.5 ${
                          m.status === "completed"
                            ? "bg-emerald-600 text-white"
                            : m.status === "current"
                            ? "bg-indigo-600 text-white animate-pulse"
                            : "bg-slate-200 text-slate-500"
                        }`}>
                          {m.status === "completed" ? "✓" : idx + 1}
                        </div>
                        <p className="text-[11px] font-bold truncate">{m.label}</p>
                        <p className="text-[9px] opacity-75 truncate">{m.sublabel}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline History */}
              {searchedRecord.checkpoints && searchedRecord.checkpoints.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Live Checkpoint Scans
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {searchedRecord.checkpoints.map((step, idx) => (
                      <div key={idx} className="relative">
                        <span
                          className={`absolute -left-6 top-1 grid size-4 place-items-center rounded-full text-white text-[9px] font-bold ${
                            idx === 0 ? "bg-indigo-600 ring-4 ring-indigo-100" : "bg-slate-300"
                          }`}
                        >
                          ✓
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                          <span className={`font-semibold ${idx === 0 ? "text-slate-900" : "text-slate-700"}`}>
                            {step.activity}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {step.timestamp}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {step.location}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Full Dedicated Page Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Verified tracking via courier gateway
                </span>
                <Link
                  href={`/track/${encodeURIComponent(searchedRecord.awbNumber)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <span>Open Full Tracking Page</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. ONE OPERATING LAYER SECTION */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-2">
              One operating layer
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              The essential workflows, connected.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              Give operations teams the context they need without turning daily logistics into a maze of disconnected tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Order control */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Boxes size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Order control
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Bring orders, labels, and pickup preparation into one focused workflow.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-indigo-600" />
                  <span>Single-click bulk shipping labels</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-indigo-600" />
                  <span>Carrier manifest generation</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Courier visibility */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Truck size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Courier visibility
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Keep shipment movement and service performance easy to review.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-blue-600" />
                  <span>Multi-carrier telemetry SLA</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-blue-600" />
                  <span>Automated NDR exception handling</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Finance clarity */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CreditCard size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Finance clarity
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Review settlement readiness and logistics costs with less reconciliation work.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>T+2 Days (Delivery + 2 Days) guaranteed COD payout</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Automatic bank UTR reconciliation</span>
                </li>
              </ul>
            </div>

            {/* Card 4: Store integration */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Layers size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Store integration
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect incoming orders to the operations workspace your team already uses.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-purple-600" />
                  <span>Shopify &amp; WooCommerce Sync</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-purple-600" />
                  <span>Rest API Webhook dispatches</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SHIPPING RATE CALCULATOR */}
      <section id="rates" className="py-16 sm:py-24 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-2">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Instant Shipping Rate Calculator
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Compare live courier rates across India and calculate exact freight deductions before shipping.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            {/* Input Form */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
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
                  {["0.5", "1.0", "2.0", "3.0", "5.0", "6.0"].map((w) => (
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

            {/* Courier Comparison Cards */}
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

              {/* Shadowfax Cargo (1kg–6kg Plan) */}
              <div className={`rounded-2xl border p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all ${
                weight > 0.5 ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20" : "border-slate-200 bg-white"
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Shadowfax Cargo (1kg–6kg Surface)</span>
                    <span className="rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2">
                      {weight > 0.5 ? "★ Best for Heavy" : "Flat Slab"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    1kg–6kg Flat Surface Plan &bull; SLA: 3-4 Days &bull; 100% Pan India
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

              {/* Shadowfax Express (0.5kg Air) */}
              <div className={`rounded-2xl border p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all ${
                weight <= 0.5 ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20" : "border-slate-200 bg-white"
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Shadowfax Express (0.5KG Air)</span>
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

              {/* Xpressbees */}
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

          {/* 6.2 Public Transparent Rate Card Table */}
          <div className="mt-12 max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-indigo-600 text-white text-xs">₹</span>
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
                    <th className="px-4 py-3">RTO Return Charge</th>
                    <th className="px-4 py-3">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">0 – 500g (0.5 kg)</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                        Shadowfax Express
                      </span>
                    </td>
                    <td className="px-4 py-3">Air Lite</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹72.00</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹72.00</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                        ₹0 (100% Free)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">2-3 Days</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-indigo-50/20">
                    <td className="px-4 py-3 font-bold text-slate-900">1.0 kg – 6.0 kg (Flat Slab)</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                        Shadowfax Cargo
                      </span>
                    </td>
                    <td className="px-4 py-3">Surface Flat (1kg–6kg)</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹99.00</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹99.00</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                        ₹0 (100% Free)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">3-4 Days</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">0 – 500g (0.5 kg) Surface</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                        Xpressbees Surface
                      </span>
                    </td>
                    <td className="px-4 py-3">Surface 500g</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹98.00</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹98.00</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                        ₹0 (100% Free)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">2-4 Days</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-indigo-50/20">
                    <td className="px-4 py-3 font-bold text-slate-900">0 – 500g (0.5 kg) Direct</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                        Delhivery Direct
                      </span>
                    </td>
                    <td className="px-4 py-3">Direct Air/Surface</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹110.00</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹110.00</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                        ₹0 (100% Free)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">2-3 Days</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">Above 6.0 kg (+1 kg)</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                        Shadowfax Cargo
                      </span>
                    </td>
                    <td className="px-4 py-3">Cargo Extra Slab</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">+₹20.00 / kg</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">+₹20.00 / kg</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                        ₹0 (100% Free)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">3-5 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PINCODE SERVICEABILITY MATRIX */}
      <section id="serviceability" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-2">
              Pan-India Network Reach
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Pincode Serviceability Matrix
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Check 10,000+ Indian PIN codes, COD availability, and reverse pickup coverage across all courier partners.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <PincodeServiceabilityMatrix />
          </div>
        </div>
      </section>

      {/* 8. FEATURED LOGISTICS BLOG & GUIDES SECTION */}
      <section className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
                <Sparkles size={14} />
                <span>Logistics Insights &amp; Operational Guides</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                Mastering Indian D2C Logistics
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-2xl">
                Expert playbooks on reducing RTO, optimizing volumetric weight, evaluating courier performance, and accelerating COD remittances.
              </p>
            </div>

            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
            >
              View all articles <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] hover:bg-white shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className={`absolute top-3 left-3 rounded-lg px-2.5 py-0.5 text-[10px] font-bold border backdrop-blur-md shadow-xs ${post.categoryColor}`}>
                      {post.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <span>{post.publishedAt}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">{post.author.name}</span>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Read guide <ChevronRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 9. MINIMALIST MODERN FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Shipwave. Logistics operations with clarity.</p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <button
              type="button"
              onClick={() => scrollToSection("rates")}
              className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors cursor-pointer"
            >
              Pricing (From ₹72)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("serviceability")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Coverage
            </button>
            <button
              type="button"
              onClick={scrollToTracking}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Track shipment
            </button>
            <Link href="/blog" className="hover:text-slate-900 transition-colors">
              Blog
            </Link>
            <Link href="/forgot-password" className="hover:text-slate-900 transition-colors">
              Account recovery
            </Link>
            <button
              type="button"
              onClick={() => setActiveModal("about")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("contact")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("terms")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* INFO / MODAL DIALOGS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {activeModal === "about"
                  ? "About Shipwave Logistics"
                  : activeModal === "contact"
                  ? "Contact & Support Desk"
                  : activeModal === "terms"
                  ? "Terms of Service"
                  : "Privacy Policy"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {activeModal === "about" && (
                <>
                  <p>
                    <strong>Shipwave</strong> is a next-generation multi-carrier logistics operating system built specifically for Indian D2C e-commerce brands, sellers, and retail enterprises.
                  </p>
                  <p>
                    We aggregate India&apos;s leading couriers including Shadowfax, Xpressbees, Delhivery, Blue Dart, Ekart, and DTDC under a single unified API and dashboard.
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>10,000+ serviceable postal pincodes across 2,500+ Indian cities</li>
                    <li>Guaranteed T+2 Days (Delivery + 2 Days) Cash on Delivery (COD) Remittance</li>
                    <li>Automated WhatsApp NDR verification &amp; RTO reduction engine</li>
                  </ul>
                </>
              )}

              {activeModal === "contact" && (
                <>
                  <p>Our dedicated logistics merchant support team is available 24/7:</p>
                  <div className="rounded-xl bg-slate-50 p-3 space-y-2 border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-indigo-600" />
                      <span>Email: <strong>support@dhanbyte.me</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-emerald-600" />
                      <span>Helpline: <strong>+91 98765 43210</strong> (Mon - Sat, 9 AM - 8 PM IST)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-indigo-600" />
                      <span>HQ: New Delhi, India</span>
                    </div>
                  </div>
                </>
              )}

              {activeModal === "terms" && (
                <>
                  <p>
                    By using Shipwave, you agree to our standard freight terms, courier SLA compliance policies, and automated billing reconciliations.
                  </p>
                  <p>
                    All shipments are subject to carrier volumetric dead-weight guidelines. Invoices and COD disbursements are reconciled automatically under Indian GST and banking laws.
                  </p>
                </>
              )}

              {activeModal === "privacy" && (
                <>
                  <p>
                    Shipwave takes your operational privacy seriously. Customer consignee phone numbers and addresses are tokenized for courier airway bill generation only.
                  </p>
                  <p>
                    Public tracking searches are kept in client-side volatile state and are never indexed or sold to third-party ad networks.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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


// Sample mock tracking database for public tracking lookup demo
interface TrackingRecord {
  awb: string;
  courier: string;
  status: "In Transit" | "Out for Delivery" | "Delivered" | "Manifested";
  statusColor: string;
  origin: string;
  destination: string;
  recipient: string;
  lastUpdated: string;
  eta: string;
  timeline: { title: string; time: string; location: string; done: boolean }[];
}

const SAMPLE_TRACKING_DATA: Record<string, TrackingRecord> = {
  "SFX-8823401": {
    awb: "SFX-8823401",
    courier: "Shadowfax Express",
    status: "Out for Delivery",
    statusColor: "text-amber-600 bg-amber-50 border-amber-200",
    origin: "Bhiwandi Hub, Maharashtra",
    destination: "Indiranagar, Bengaluru, Karnataka",
    recipient: "Kavita S. (Verified Customer)",
    lastUpdated: "Today, 09:30 AM",
    eta: "Today by 06:00 PM",
    timeline: [
      { title: "Out for delivery with courier rider", time: "Today, 08:45 AM", location: "Bengaluru East DC", done: true },
      { title: "Shipment reached destination hub", time: "Yesterday, 11:20 PM", location: "Bengaluru Mega Hub", done: true },
      { title: "In transit via Air Cargo", time: "Yesterday, 02:10 PM", location: "Mumbai Airport Hub", done: true },
      { title: "Pickup completed & weighed", time: "24 Aug, 04:30 PM", location: "Seller Warehouse, Mumbai", done: true },
      { title: "Shipping label generated", time: "24 Aug, 11:15 AM", location: "Shipwave Central OS", done: true },
    ],
  },
  "XPB-9948210": {
    awb: "XPB-9948210",
    courier: "Xpressbees Surface",
    status: "Delivered",
    statusColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
    origin: "Okhla Phase III, New Delhi",
    destination: "Koregaon Park, Pune, Maharashtra",
    recipient: "Anand M. (Prepaid Order)",
    lastUpdated: "25 Aug, 02:15 PM",
    eta: "Delivered on 25 Aug",
    timeline: [
      { title: "Delivered to recipient with OTP verification", time: "25 Aug, 02:15 PM", location: "Pune Delivery Station", done: true },
      { title: "Out for delivery", time: "25 Aug, 09:00 AM", location: "Pune Central Hub", done: true },
      { title: "Arrived at distribution facility", time: "24 Aug, 08:30 PM", location: "Pune Logistics Park", done: true },
      { title: "Dispatched from origin center", time: "23 Aug, 10:00 PM", location: "Delhi Gateway", done: true },
    ],
  },
  "DLV-5541092": {
    awb: "DLV-5541092",
    courier: "Delhivery Surface",
    status: "In Transit",
    statusColor: "text-indigo-600 bg-indigo-50 border-indigo-200",
    origin: "Surat Textile Hub, Gujarat",
    destination: "Salt Lake Sector V, Kolkata",
    recipient: "Pooja V. (COD: ₹1,499)",
    lastUpdated: "Today, 11:10 AM",
    eta: "Tomorrow by 04:00 PM",
    timeline: [
      { title: "Linehaul departure to destination transit node", time: "Today, 10:00 AM", location: "Nagpur Sorting Center", done: true },
      { title: "Consolidated into linehaul container", time: "Yesterday, 07:15 PM", location: "Surat Hub", done: true },
      { title: "Shipment manifested & picked up", time: "Yesterday, 01:20 PM", location: "Surat Origin Warehouse", done: true },
    ],
  },
};

export default function LandingPage() {
  // Auth card mode
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  // Refs for smooth scroll & focus
  const trackingInputRef = useRef<HTMLInputElement>(null);
  const authCardRef = useRef<HTMLDivElement>(null);

  // Active info modal state
  const [activeModal, setActiveModal] = useState<"about" | "contact" | "terms" | "privacy" | null>(null);

  // Public Tracking State
  const [trackingAwb, setTrackingAwb] = useState("");
  const [searchedRecord, setSearchedRecord] = useState<TrackingRecord | null>(SAMPLE_TRACKING_DATA["SFX-8823401"]);
  const [trackingError, setTrackingError] = useState("");

  // Rate Calculator State
  const [pickupPincode, setPickupPincode] = useState("110020");
  const [deliveryPincode, setDeliveryPincode] = useState("400001");
  const [weightKg, setWeightKg] = useState("0.5");
  const [paymentMode, setPaymentMode] = useState<"PREPAID" | "COD">("PREPAID");

  // Rate calculation estimates
  const weight = Math.max(0.5, Number(weightKg) || 0.5);
  const shadowfaxRate = Math.round(38 + (weight > 0.5 ? Math.ceil((weight - 0.5) / 0.5) * 30 : 0));
  const xpressbeesRate = Math.round(42 + (weight > 0.5 ? Math.ceil((weight - 0.5) / 0.5) * 32 : 0));
  const delhiveryRate = Math.round(45 + (weight > 0.5 ? Math.ceil((weight - 0.5) / 0.5) * 34 : 0));

  function handleTrackSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = trackingAwb.trim().toUpperCase();
    if (!query) {
      setTrackingError("Please enter a valid AWB or Tracking ID.");
      return;
    }

    setTrackingError("");
    const matched = SAMPLE_TRACKING_DATA[query];
    if (matched) {
      setSearchedRecord(matched);
    } else {
      // Create a simulated live tracking response for any entered AWB
      setSearchedRecord({
        awb: query,
        courier: query.startsWith("SF") ? "Shadowfax Express" : query.startsWith("XP") ? "Xpressbees" : "Express Linehaul",
        status: "In Transit",
        statusColor: "text-indigo-600 bg-indigo-50 border-indigo-200",
        origin: "Origin Fulfillment Hub",
        destination: "Destination Delivery Hub",
        recipient: "Customer Consignee (Secure)",
        lastUpdated: "Just now",
        eta: "2-3 business days",
        timeline: [
          { title: "In Transit to destination facility", time: "Today, Recent Scan", location: "Transit Sorting Hub", done: true },
          { title: "Processed at carrier sorting hub", time: "Earlier Today", location: "Origin Facility", done: true },
          { title: "Picked up & manifest sealed", time: "Yesterday", location: "Merchant Fulfillment Hub", done: true },
        ],
      });
    }
    // Clear input reference from field after submission for privacy as stated in copy
    setTrackingAwb("");
  }

  function handleSelectSample(awb: string) {
    setTrackingAwb(awb);
    setSearchedRecord(SAMPLE_TRACKING_DATA[awb] || null);
    setTrackingError("");
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
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => scrollToSection("platform")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={scrollToTracking}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Track shipment
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Operating Layer
            </button>
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
            <button
              type="button"
              onClick={() => scrollToAuth("login")}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => scrollToAuth("register")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Get started
            </button>
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
                <button
                  type="button"
                  onClick={() => scrollToAuth("register")}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <span>Start with Shipwave</span>
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

              {/* Courier Partners List */}
              <div className="pt-6 border-t border-slate-200/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Unified Indian Courier Engine
                </p>
                <p className="text-xs font-medium text-slate-600 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">Delhivery</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800">Blue Dart</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800">Xpressbees</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800">Ekart</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-800">Shadowfax</span>
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

      {/* 3. PRODUCT PREVIEW SECTION */}
      <section id="platform" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-2">
              Product preview
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              A connected command center
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              Keep orders, delivery performance, courier activity, and revenue in one operational view.
            </p>
          </div>

          {/* Interactive Mockup Dashboard Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-7 shadow-lg shadow-slate-100">
            {/* Top Stat Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Active Shipments
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  1,482
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp size={12} /> 94.2% on-time SLA
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  COD Available
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  ₹84,250
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 mt-1">
                  <Clock size={12} /> T+3 Daily Remittance
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  NDR Resolution Rate
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  78.4%
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                  <RotateCcw size={12} /> Automated WhatsApp
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Integrated Couriers
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  6 Couriers
                </span>
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 size={12} className="text-emerald-500" /> 10,000+ PINs (2,500+ Cities)
                </span>
              </div>
            </div>

            {/* Dashboard Operational Table Preview */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Live Dispatch Activity &bull; Today&apos;s Batches
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToAuth("register")}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Command Center</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Order / AWB</th>
                      <th className="px-4 py-2.5">Customer &amp; Route</th>
                      <th className="px-4 py-2.5">Carrier</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        #ORD-90241
                        <span className="block text-[10px] text-slate-400 font-mono">SFX-8823401</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">Kavita S.</span>
                        <span className="block text-[10px] text-slate-400">Bhiwandi &rarr; Bengaluru (560038)</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          Shadowfax Express
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">₹1,850 <span className="text-[10px] text-slate-400 font-normal">(COD)</span></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/70 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Out for Delivery
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        #ORD-90240
                        <span className="block text-[10px] text-slate-400 font-mono">XPB-9948210</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">Anand M.</span>
                        <span className="block text-[10px] text-slate-400">Delhi &rarr; Pune (411001)</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                          Xpressbees Surface
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">₹2,499 <span className="text-[10px] text-emerald-600 font-semibold">(Prepaid)</span></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Delivered
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        #ORD-90239
                        <span className="block text-[10px] text-slate-400 font-mono">DLV-5541092</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">Pooja V.</span>
                        <span className="block text-[10px] text-slate-400">Surat &rarr; Kolkata (700091)</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                          Delhivery Surface
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">₹1,499 <span className="text-[10px] text-slate-400 font-normal">(COD)</span></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/70 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                          In Transit
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PUBLIC TRACKING SECTION */}
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
                  onChange={(e) => setTrackingAwb(e.target.value)}
                  placeholder="AWB number (e.g. SFX-8823401, XPB-9948210)"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-4 pr-10 text-xs sm:text-sm font-medium outline-none shadow-xs transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
                <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button
                type="submit"
                className="h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer shrink-0"
              >
                <span>Track shipment</span>
                <ArrowRight size={15} />
              </button>
            </form>

            {trackingError && (
              <p className="text-xs text-red-600 font-medium mt-2 text-center">
                {trackingError}
              </p>
            )}

            {/* Quick Demo Sample AWBs */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
              <span>Try sample:</span>
              <button
                type="button"
                onClick={() => handleSelectSample("SFX-8823401")}
                className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 border border-indigo-200/60 px-2 py-0.5 rounded-md cursor-pointer"
              >
                SFX-8823401
              </button>
              <button
                type="button"
                onClick={() => handleSelectSample("XPB-9948210")}
                className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 border border-indigo-200/60 px-2 py-0.5 rounded-md cursor-pointer"
              >
                XPB-9948210
              </button>
              <button
                type="button"
                onClick={() => handleSelectSample("DLV-5541092")}
                className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 border border-indigo-200/60 px-2 py-0.5 rounded-md cursor-pointer"
              >
                DLV-5541092
              </button>
            </div>
          </div>

          {/* Tracking Result View */}
          {searchedRecord && (
            <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">AWB Reference</span>
                    <span className="font-mono text-base font-bold text-slate-900">
                      {searchedRecord.awb}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Carrier: <strong className="text-slate-800">{searchedRecord.courier}</strong> &bull; Updated: {searchedRecord.lastUpdated}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${searchedRecord.statusColor}`}>
                    <span className="size-2 rounded-full bg-current" />
                    {searchedRecord.status}
                  </span>
                </div>
              </div>

              {/* Route Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Origin Dispatch
                  </span>
                  <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                    {searchedRecord.origin}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Estimated Delivery
                  </span>
                  <span className="text-xs font-semibold text-indigo-700 block mt-0.5">
                    {searchedRecord.eta}
                  </span>
                </div>
              </div>

              {/* Timeline Milestones */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tracking History
                </h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {searchedRecord.timeline.map((step, idx) => (
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
                          {step.title}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {step.time}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {step.location}
                      </span>
                    </div>
                  ))}
                </div>
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
                  <span>T+3 Days guaranteed COD payout</span>
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
                  Dead Weight (KG)
                </label>
                <div className="flex items-center gap-2">
                  {["0.5", "1.0", "2.0", "5.0"].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeightKg(w)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border cursor-pointer ${
                        weightKg === w
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {w} kg
                    </button>
                  ))}
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
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Prepaid (0% COD fee)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("COD")}
                    className={`rounded-lg py-2 text-xs font-bold border cursor-pointer ${
                      paymentMode === "COD"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    COD (Cash on Delivery)
                  </button>
                </div>
              </div>
            </div>

            {/* Courier Comparison Cards */}
            <div className="lg:col-span-7 space-y-3">
              {/* Shadowfax */}
              <div className="rounded-2xl border border-indigo-200/80 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Shadowfax Express</span>
                    <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2">
                      Cheapest
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Est. delivery: 2-3 Days &bull; Surface / Air multimodal
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    {formatINR(shadowfaxRate)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">+ 18% GST</span>
                </div>
              </div>

              {/* Xpressbees */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Xpressbees Surface</span>
                    <span className="rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-1.5 py-0.2">
                      High SLA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Est. delivery: 2-4 Days &bull; Heavy freight friendly
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    {formatINR(xpressbeesRate)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">+ 18% GST</span>
                </div>
              </div>

              {/* Delhivery */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Delhivery Surface</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Est. delivery: 2-3 Days &bull; 10,000+ PIN reach
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    {formatINR(delhiveryRate)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">+ 18% GST</span>
                </div>
              </div>
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

      {/* 8. MINIMALIST MODERN FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Shipwave. Logistics operations with clarity.</p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <button
              type="button"
              onClick={() => scrollToSection("platform")}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={scrollToTracking}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Track shipment
            </button>
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
                    <li>Guaranteed T+3 Days Cash on Delivery (COD) Remittance</li>
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

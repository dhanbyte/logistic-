"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Package,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { saveGodownOnboardingAction } from "@/app/ecommerce-actions";

export interface CourierStatus {
  courierCode: string;
  courierName: string;
  serviceType: string;
  pickupServiceable: boolean;
  deliveryServiceable: boolean;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimatedSla: string;
  cutoffTime: string;
  status: string;
}

export function OnboardingWizard({
  hasWarehouses = false,
  userEmail = "",
}: {
  hasWarehouses?: boolean;
  userEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mounted, setMounted] = useState(false);
  const [isConfigured, setIsConfigured] = useState(hasWarehouses);

  // Form State for Godown Setup
  const [godownName, setGodownName] = useState("Main Godown / Hub");
  const [contactPerson, setContactPerson] = useState(userEmail ? userEmail.split("@")[0] : "Warehouse Manager");
  const [contactPhone, setContactPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Live Serviceability Testing State
  const [testingServiceability, setTestingServiceability] = useState(false);
  const [serviceabilityResult, setServiceabilityResult] = useState<{
    isServiceable: boolean;
    zoneLabel?: string;
    city?: string;
    state?: string;
    couriers?: CourierStatus[];
    error?: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem("shipwave_onboarding_dismissed");
    // Only auto-open if user has NO warehouses and hasn't explicitly dismissed it
    if (!dismissed && !hasWarehouses) {
      setOpen(true);
    }
  }, [hasWarehouses]);

  function handleClose() {
    setOpen(false);
    localStorage.setItem("shipwave_onboarding_dismissed", "true");
  }

  function handleReopen() {
    setOpen(true);
    setStep(1);
  }

  // Live Pincode Verification via Postal & Courier APIs
  async function testPincodeServiceability(pinToTest = pincode) {
    const clean = pinToTest.replace(/\D/g, "");
    if (clean.length !== 6) {
      toast.error("Please enter a valid 6-digit PIN code.");
      return;
    }

    setTestingServiceability(true);
    setServiceabilityResult(null);

    try {
      const res = await fetch(`/api/couriers/serviceability?pickup_pincode=${clean}&pincode=110001`);
      const data = await res.json();

      if (data.success && data.route?.origin) {
        const origin = data.route.origin;
        setCity(origin.city || "");
        setState(origin.state || "");
        setServiceabilityResult({
          isServiceable: true,
          zoneLabel: origin.isMetro ? "Metro Zone (Priority Dispatch)" : data.route.zoneLabel || "Zone B (Regional)",
          city: origin.city,
          state: origin.state,
          couriers: data.couriers || [],
        });
        toast.success(`Serviceable! Pickup Hub verified for ${origin.city}, ${origin.state}`);
      } else {
        setServiceabilityResult({
          isServiceable: false,
          error: data.error || "Pincode is not currently serviceable for doorstep pickup.",
        });
        toast.error("Pincode not serviceable for automated courier dispatch");
      }
    } catch (err) {
      setServiceabilityResult({
        isServiceable: false,
        error: "Failed to connect to Courier Serviceability API. Please check your connection.",
      });
    } finally {
      setTestingServiceability(false);
    }
  }

  // Handle PIN input change & auto-trigger test on 6 digits
  function handlePincodeChange(val: string) {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      testPincodeServiceability(clean);
    }
  }

  // Save Godown Action
  async function handleSaveGodown() {
    if (!addressLine1 || !pincode || !city || !state || !contactPhone) {
      toast.error("Please fill in all compulsory godown details.");
      return;
    }

    setSaving(true);
    try {
      const res = await saveGodownOnboardingAction({
        warehouseName: godownName,
        contactPerson,
        contactPhone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
      });

      if (!res.ok) {
        toast.error(res.message);
        setSaving(false);
        return;
      }

      setIsConfigured(true);
      setStep(4);
      localStorage.setItem("shipwave_onboarding_dismissed", "true");
      toast.success("🎉 Godown address saved & verified with live couriers!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save warehouse.");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  // IF GODOWN IS ALREADY CONFIGURED -> SHOW HIGH-CONVERTING "CREATE YOUR FIRST ORDER" HERO BANNER
  if (isConfigured) {
    return (
      <div className="mb-6 rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-indigo-50/70 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm shrink-0">
              <Package size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Pickup Godown Verified &amp; Ready for Shipping!
                </h3>
                <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Doorstep Pickup Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Multi-courier dispatch (Shadowfax, Xpressbees, Delhivery) is active. Create your shipment to generate shipping labels and manifests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/orders/new"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Your First Order</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/warehouses"
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition shadow-2xs cursor-pointer"
            >
              Manage Godowns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Banner on Dashboard if Godown is NOT configured yet */}
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-emerald-500/10 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Welcome to Shipwave Logistics Hub!
                </h3>
                <span className="rounded-full bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                  Quickstart Setup
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Setup your pickup godown address and test live courier serviceability in under 1 minute.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReopen}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
            >
              <span>🚀 Setup Godown &amp; Tour</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Onboarding Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header with Progress Steps */}
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-xl bg-indigo-600 text-white font-black text-xs">
                    S
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      {step === 1 && "Shipwave Platform Features Tour"}
                      {step === 2 && "Configure Pickup Godown Address"}
                      {step === 3 && "Live Courier API Serviceability Test"}
                      {step === 4 && "Setup Complete — Ready to Ship!"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Step {step} of 4 • {step === 1 ? "Overview" : step === 2 ? "Address Details" : step === 3 ? "API Verification" : "Launch"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  title="Close tour"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[
                  { num: 1, label: "Features" },
                  { num: 2, label: "Godown Info" },
                  { num: 3, label: "API Test" },
                  { num: 4, label: "Complete" },
                ].map((s) => (
                  <div key={s.num} className="space-y-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        step >= s.num ? "bg-indigo-600" : "bg-slate-100"
                      }`}
                    />
                    <p
                      className={`text-[10px] font-semibold text-center ${
                        step === s.num ? "text-indigo-600 font-bold" : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6">
              {/* STEP 1: FEATURES TOUR */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                    <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-600" />
                      Everything You Need to Scale Indian E-Commerce Logistics
                    </h3>
                    <p className="mt-1 text-xs text-indigo-800">
                      Shipwave brings together India’s top express &amp; surface courier networks on a single dashboard with real-time tracking, lowest shipping rates, and instant COD remittance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {/* Feature 1 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-indigo-200 transition">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                          <Truck size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Multi-Courier Rate Optimization</h4>
                          <span className="text-[10px] text-emerald-600 font-semibold">Shadowfax, Xpressbees, Delhivery</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Automatic cheapest courier allocation for 0.5kg Air parcels and heavy 7kg+ surface shipments with zero weight discrepancy issues.
                      </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-indigo-200 transition">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
                          <Radio size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">AI-Powered NDR &amp; WhatsApp Flow</h4>
                          <span className="text-[10px] text-amber-600 font-semibold">Reduce RTO by up to 40%</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Automated WhatsApp re-attempt requests sent to buyers when a delivery fails, verifying address &amp; phone before return to origin.
                      </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-indigo-200 transition">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="grid size-8 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
                          <Wallet size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Instant COD Remittance (T+1/T+2)</h4>
                          <span className="text-[10px] text-indigo-600 font-semibold">Automated Bank Payouts</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        No more waiting weeks for cash flow. COD collections from couriers are reconciled and settled directly to your registered bank account.
                      </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-indigo-200 transition">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="grid size-8 place-items-center rounded-lg bg-sky-100 text-sky-700">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Single &amp; Bulk Thermal Shipping Labels</h4>
                          <span className="text-[10px] text-sky-600 font-semibold">1-Click PDF &amp; Manifests</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Generate official courier thermal barcode labels (4x6 format) and handover pickup manifests ready for the driver on arrival.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                    >
                      <span>Next: Enter Pickup Godown Details</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: GODOWN ADDRESS FORM */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
                    <Building2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">
                        Where should couriers arrive for daily parcel pickups?
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Please enter your primary dispatch warehouse or shop location. Courier riders will arrive at this address to scan and collect parcels.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Godown / Warehouse Label <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={godownName}
                          onChange={(e) => setGodownName(e.target.value)}
                          placeholder="e.g. Surat Main Godown"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-600"
                        />
                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Pickup Contact Person <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-600"
                        />
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Contact Mobile (for Courier Rider) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 font-semibold text-xs border-r border-slate-200 pr-2">
                          <Phone size={13} className="text-slate-400" />
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          maxLength={10}
                          placeholder="9876543210"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-18 pr-3 text-xs outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Pickup Pincode (6-Digits) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          maxLength={6}
                          placeholder="e.g. 380005 or 110020"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-12 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                        />
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600" />
                        {testingServiceability && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="size-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent inline-block" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Complete Godown Address (Line 1) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Plot No / Building / Gala No, Industrial Area"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Landmark / Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Near Metro Station / Highway Junction"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Auto-detected from PIN"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium outline-none focus:bg-white focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Auto-detected from PIN"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium outline-none focus:bg-white focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      ← Back to Tour
                    </button>

                    <button
                      onClick={() => {
                        if (!pincode || pincode.length !== 6 || !addressLine1 || !contactPhone) {
                          toast.error("Please fill all required fields before running the API test.");
                          return;
                        }
                        setStep(3);
                        testPincodeServiceability(pincode);
                      }}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                    >
                      <span>Proceed to Live API Test</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: LIVE COURIER API VERIFICATION */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs">
                          <Radio size={18} className="animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Testing Pickup Hub Serviceability for PIN: {pincode}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {city ? `${city}, ${state}` : "Querying Shadowfax, Xpressbees & Delhivery APIs…"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => testPincodeServiceability(pincode)}
                        disabled={testingServiceability}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                      >
                        <RefreshCw size={13} className={testingServiceability ? "animate-spin" : ""} />
                        <span>Re-test API</span>
                      </button>
                    </div>
                  </div>

                  {/* Loading or Results */}
                  {testingServiceability ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="size-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">
                        Querying courier postal databases &amp; live dispatch hubs…
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Verifying Doorstep Pickup SLAs, COD acceptance &amp; Transit Cutoffs
                      </p>
                    </div>
                  ) : serviceabilityResult?.isServiceable ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span>100% Serviceable — All Couriers Ready for Doorstep Pickup!</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          {serviceabilityResult.zoneLabel}
                        </span>
                      </div>

                      {/* Courier List Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(serviceabilityResult.couriers || []).map((c) => (
                          <div
                            key={c.courierCode}
                            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">{c.courierName}</span>
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500">{c.serviceType}</p>

                            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-slate-600 border-t border-slate-100">
                              <div>
                                <span className="text-slate-400 block">Pickup SLA:</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                                  <Clock size={11} className="text-indigo-600" />
                                  Same-Day
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Cutoff Time:</span>
                                <span className="font-bold text-slate-800 mt-0.5 block">{c.cutoffTime}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 space-y-2">
                      <p className="font-bold">Serviceability Check Failed</p>
                      <p>{serviceabilityResult?.error || "This PIN code is currently outside automated pickup zones."}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      ← Edit Address
                    </button>

                    <button
                      onClick={handleSaveGodown}
                      disabled={saving || !serviceabilityResult?.isServiceable}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Saving Godown…</span>
                        </span>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          <span>Save &amp; Activate Godown</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUCCESS & READY TO SHIP */}
              {step === 4 && (
                <div className="text-center py-6 space-y-4">
                  <div className="grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 mx-auto shadow-inner">
                    <Rocket size={32} className="animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900">
                      Congratulations! Your Pickup Godown is Active 🎉
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      <strong>{godownName}</strong> ({city}, {state} - {pincode}) is now set as your primary pickup hub for Shadowfax, Xpressbees, and Delhivery dispatches.
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left max-w-md mx-auto space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">Pickup Location:</span>
                      <span className="font-bold text-slate-900">{addressLine1}, {pincode}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">Contact Number:</span>
                      <span className="font-bold text-slate-900">+91 {contactPhone}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">Courier Dispatch:</span>
                      <span className="font-bold text-emerald-700">Enabled (Doorstep Pickup)</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                    <Link
                      href="/orders/new"
                      onClick={handleClose}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                    >
                      <Package size={15} />
                      <span>Create Your First Order</span>
                    </Link>

                    <button
                      onClick={handleClose}
                      className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-2.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
                    >
                      Explore Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Gift,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Plus,
  Radio,
  Scale,
  ShieldCheck,
  Tag,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createMerchantUserAction } from "@/app/admin-actions";

export function AddUserModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [billingMode, setBillingMode] = useState<"PREPAID_WALLET" | "POSTPAID_COD_DEDUCT">("PREPAID_WALLET");
  const [pricingTier, setPricingTier] = useState<"STANDARD" | "SILVER" | "GOLD" | "CUSTOM">("STANDARD");
  const [initialWalletBalance, setInitialWalletBalance] = useState(1000);
  const [freeCredit, setFreeCredit] = useState(500);
  const [creditLimit, setCreditLimit] = useState(2000);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !companyName.trim()) {
      toast.error("Please fill in all mandatory details.");
      return;
    }

    setLoading(true);
    const res = await createMerchantUserAction({
      fullName,
      email,
      phone,
      companyName,
      billingMode,
      pricingTier,
      initialWalletBalance: Number(initialWalletBalance),
      freeCredit: Number(freeCredit),
      creditLimit: Number(creditLimit),
    });
    setLoading(false);

    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setCompanyName("");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
      >
        <Plus size={15} />
        <span>Add New Merchant User</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <User size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Onboard New Merchant Account</h3>
                  <p className="text-xs text-slate-500">
                    Create seller account, set billing model, assign courier rates &amp; credit limit.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* 1. Basic Account Info */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Merchant Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Sharma Apparels Pvt Ltd"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Login Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. aarav@sharmaapparels.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. Billing & Deduction Model (Advance vs COD Auto-Deduction) */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2">
                <label className="block font-bold text-slate-900">
                  Payment Collection &amp; Freight Deduction Model *
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label
                    className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                      billingMode === "PREPAID_WALLET"
                        ? "border-indigo-600 bg-white shadow-xs"
                        : "border-slate-200 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="billingMode"
                      checked={billingMode === "PREPAID_WALLET"}
                      onChange={() => setBillingMode("PREPAID_WALLET")}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Prepaid Wallet (Advance)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Order ship hone se pehle merchant ke wallet se freight deduct hoga.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                      billingMode === "POSTPAID_COD_DEDUCT"
                        ? "border-indigo-600 bg-white shadow-xs"
                        : "border-slate-200 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="billingMode"
                      checked={billingMode === "POSTPAID_COD_DEDUCT"}
                      onChange={() => setBillingMode("POSTPAID_COD_DEDUCT")}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Postpaid COD Deduction</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Advance paise nahi lenge. Delivery ke baad COD collection me se cut hoga.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Courier Pricing Plan Template */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign Courier Pricing Plan Template *
                </label>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setPricingTier("STANDARD")}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      pricingTier === "STANDARD"
                        ? "border-indigo-600 bg-indigo-50 font-bold text-indigo-900"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-[11px]">🥉 Standard / Bronze</span>
                    <span className="text-[10px] text-slate-500 font-normal">SF: ₹49, XB: ₹52</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPricingTier("SILVER")}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      pricingTier === "SILVER"
                        ? "border-indigo-600 bg-indigo-50 font-bold text-indigo-900"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-[11px]">🥈 Silver Plan</span>
                    <span className="text-[10px] text-slate-500 font-normal">SF: ₹42, XB: ₹45</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPricingTier("GOLD")}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      pricingTier === "GOLD"
                        ? "border-indigo-600 bg-indigo-50 font-bold text-indigo-900"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-[11px]">🥇 Gold Enterprise</span>
                    <span className="text-[10px] text-slate-500 font-normal">SF: ₹38, XB: ₹40</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPricingTier("CUSTOM")}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      pricingTier === "CUSTOM"
                        ? "border-indigo-600 bg-indigo-50 font-bold text-indigo-900"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-[11px]">🛠️ Custom Slabs</span>
                    <span className="text-[10px] text-slate-500 font-normal">Set per courier</span>
                  </button>
                </div>
              </div>

              {/* 4. Financial Wallet & Credit Allocation */}
              <div className="grid gap-3 sm:grid-cols-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Wallet Credit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={initialWalletBalance}
                    onChange={(e) => setInitialWalletBalance(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Free Promotional Credit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={freeCredit}
                    onChange={(e) => setFreeCredit(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-emerald-700 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Allowed Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-indigo-700 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  <span>{loading ? "Creating User…" : "Onboard Merchant Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

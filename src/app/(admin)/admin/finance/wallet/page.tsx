"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  IndianRupee,
  Lock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/calculations";
import { adjustUserWalletAction } from "@/app/admin-actions";

export default function AdminWalletAdjustPage() {
  const [userId, setUserId] = useState("0b67cbd5-bf09-4c54-b4be-02d56af6f0a5");
  const [userName, setUserName] = useState("Dhananjay (Dhanbyte Logistics)");
  const [amount, setAmount] = useState<number>(500);
  const [type, setType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [reason, setReason] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please enter a mandatory audit reason for this adjustment.");
      return;
    }

    setLoading(true);
    const res = await adjustUserWalletAction({
      userId,
      amount: Number(amount),
      type,
      reason,
      referenceId: referenceId || undefined,
    });
    setLoading(false);

    if (res.ok) {
      toast.success(res.message);
      setReason("");
      setReferenceId("");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Wallet Management &amp; Balance Adjustments</h1>
        <p className="text-xs text-slate-500">
          Manual credit and debit adjustments. Every action automatically creates an immutable double-entry ledger entry.
        </p>
      </div>

      {/* Core Rule Invariant Alert */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-xs flex items-start gap-3">
        <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">Core Financial Ledger Guarantee</h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
            Never change a user&apos;s wallet balance without a corresponding financial ledger transaction.
            Every adjustment is permanently stamped with Admin ID, Reason, Prev Balance, New Balance and Transaction ID.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Adjustment Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <Wallet size={16} className="text-indigo-600" /> New Wallet Adjustment
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target User Account *</label>
              <select
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setUserName(e.target.options[e.target.selectedIndex].text);
                }}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none"
              >
                <option value="0b67cbd5-bf09-4c54-b4be-02d56af6f0a5">
                  Dhananjay (Dhanbyte Logistics) — Balance: ₹15,400
                </option>
                <option value="usr-2">Pooja Sharma (Sharma Apparels) — Balance: ₹3,250</option>
                <option value="usr-3">Rohan Verma (QuickTech India) — Balance: ₹8,900</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("CREDIT")}
                    className={`rounded-xl py-2 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      type === "CREDIT"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ArrowDownLeft size={14} /> + Credit Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("DEBIT")}
                    className={`rounded-xl py-2 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      type === "DEBIT"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ArrowUpRight size={14} /> − Debit Money
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹ INR) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-black text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mandatory Audit Reason *</label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Promotional sign-up credit / Manual COD adjustment for dispute ticket #TK-8491"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">External Reference ID (Optional)</label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. NEFT-HDFC-991823 or BANK-DISPUTE-01"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {loading ? "Recording Ledger Entry…" : "Execute Adjustment & Record Ledger"}
              </button>
            </div>
          </form>
        </div>

        {/* Live Escrow Snapshot */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <IndianRupee size={16} className="text-emerald-600" /> Platform Escrow Status
          </h3>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500">Total User Available Balance</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{formatINR(94800)}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">100% Backed by Bank Escrow</span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500">Pending Remittance On-Hold</span>
              <p className="text-xl font-black text-amber-700 mt-0.5">{formatINR(14500)}</p>
              <span className="text-[10px] text-slate-400">Locked pending Admin approval</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

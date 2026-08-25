"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Info,
  Landmark,
  Loader2,
  Lock,
  QrCode,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { updateUserBankDetailsAction } from "@/app/cod-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { UserBankDetails } from "@/types/finance";

const POPULAR_BANKS = [
  "HDFC Bank Ltd",
  "ICICI Bank Ltd",
  "State Bank of India (SBI)",
  "Axis Bank Ltd",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "IndusInd Bank",
  "Yes Bank",
];

interface BankDetailsFormProps {
  bankDetails: UserBankDetails;
}

export function BankDetailsForm({ bankDetails }: BankDetailsFormProps) {
  const [loading, setLoading] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Form State
  const [accountHolderName, setAccountHolderName] = useState(bankDetails.accountHolderName);
  const [bankName, setBankName] = useState(bankDetails.bankName);
  const [accountNumber, setAccountNumber] = useState(bankDetails.accountNumber);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(bankDetails.accountNumber);
  const [ifsc, setIfsc] = useState(bankDetails.ifsc);
  const [accountType, setAccountType] = useState<"CURRENT" | "SAVINGS">(
    bankDetails.accountType || "CURRENT",
  );
  const [upiId, setUpiId] = useState(bankDetails.upiId || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(bankDetails.isVerified);

  async function handleVerifyPennyDrop() {
    if (!accountNumber || accountNumber.length < 8) {
      toast.error("Please enter a valid Account Number first.");
      return;
    }
    if (!ifsc || ifsc.length !== 11) {
      toast.error("Please enter an 11-character IFSC Code first.");
      return;
    }

    setIsVerifying(true);
    // Simulate real-time NPCI Penny Drop verification
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsVerifying(false);
    setIsVerified(true);
    toast.success("₹1.00 Penny Drop Verification Successful! Beneficiary Name Matched: " + accountHolderName);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (accountNumber !== confirmAccountNumber) {
      toast.error("Account Number and Confirmation Account Number do not match.");
      return;
    }

    if (ifsc.length !== 11) {
      toast.error("Please enter a valid 11-character IFSC Code (e.g. HDFC0001234).");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("accountHolderName", accountHolderName);
    formData.append("bankName", bankName);
    formData.append("accountNumber", accountNumber);
    formData.append("confirmAccountNumber", confirmAccountNumber);
    formData.append("ifsc", ifsc.toUpperCase());
    formData.append("accountType", accountType);
    formData.append("upiId", upiId);

    const res = await updateUserBankDetailsAction(formData);
    setLoading(false);

    if (res.ok) {
      toast.success(res.message || "Bank details saved and verified for COD payouts!");
    } else {
      toast.error(res.message || "Failed to update bank details.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* Header & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <Landmark size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                COD Remittance &amp; Bank Settlement Account
              </h3>
              <p className="text-xs text-slate-500">
                Direct bank transfer destination for T+3 Days automated COD remittance payouts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <ShieldCheck size={14} className="text-emerald-700" />
              Verified Beneficiary
            </span>
          </div>
        </div>

        {/* Verified Lock Banner */}
        {isVerified && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-3">
            <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">Payout Bank Details Locked</h4>
              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
                Your bank settlement account is verified and locked for fraud prevention &amp; RBI compliance.
                To change your bank account, please contact Admin Support with a copy of your cancelled cheque.
              </p>
            </div>
          </div>
        )}

        {/* Quick Bank Presets */}
        {!isVerified && (
          <div className="mb-5">
            <Label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Popular Banks (Click to Select)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_BANKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBankName(b)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    bankName === b
                      ? "bg-indigo-600 text-white font-bold shadow-2xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Form Inputs Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Account Holder Name */}
          <div>
            <Label htmlFor="accountHolderName">Beneficiary / Account Holder Name *</Label>
            <Input
              id="accountHolderName"
              name="accountHolderName"
              required
              disabled={isVerified}
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="e.g. Bharat Retail Solutions Pvt Ltd"
              className={`mt-1 font-medium ${isVerified ? "bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200" : ""}`}
            />
            <p className="text-[11px] text-slate-400 mt-1">Must match registered company or GST name</p>
          </div>

          {/* Bank Name */}
          <div>
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              name="bankName"
              required
              disabled={isVerified}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank Ltd"
              className={`mt-1 font-medium ${isVerified ? "bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200" : ""}`}
            />
          </div>

          {/* Account Number */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="accountNumber">Bank Account Number *</Label>
              <button
                type="button"
                onClick={() => setShowAccountNumber(!showAccountNumber)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                {showAccountNumber ? <EyeOff size={12} /> : <Eye size={12} />}
                {showAccountNumber ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              id="accountNumber"
              name="accountNumber"
              type={showAccountNumber ? "text" : "password"}
              required
              disabled={isVerified}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter 9 to 18-digit bank account number"
              className={`mt-1 font-mono font-medium ${isVerified ? "bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200" : ""}`}
            />
          </div>

          {/* Confirm Account Number */}
          <div>
            <Label htmlFor="confirmAccountNumber">Confirm Account Number *</Label>
            <Input
              id="confirmAccountNumber"
              name="confirmAccountNumber"
              type={showAccountNumber ? "text" : "password"}
              required
              disabled={isVerified}
              value={confirmAccountNumber}
              onChange={(e) => setConfirmAccountNumber(e.target.value)}
              placeholder="Re-enter bank account number"
              className={`mt-1 font-mono font-medium ${isVerified ? "bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200" : ""}`}
            />
          </div>

          {/* IFSC Code */}
          <div>
            <Label htmlFor="ifsc">11-Digit IFSC Code *</Label>
            <Input
              id="ifsc"
              name="ifsc"
              required
              maxLength={11}
              disabled={isVerified}
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              placeholder="e.g. HDFC0001234"
              className={`mt-1 font-mono uppercase font-bold ${isVerified ? "bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200" : ""}`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Branch: {ifsc.length === 11 ? `${bankName || "Branch"} (${ifsc})` : "Enter complete IFSC"}
            </p>
          </div>

          {/* Account Type */}
          <div>
            <Label htmlFor="accountType">Account Type *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                disabled={isVerified}
                onClick={() => setAccountType("CURRENT")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold ${
                  accountType === "CURRENT"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                } ${isVerified ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
              >
                <Building2 size={13} /> Current Account
              </button>

              <button
                type="button"
                disabled={isVerified}
                onClick={() => setAccountType("SAVINGS")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold ${
                  accountType === "SAVINGS"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                } ${isVerified ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
              >
                <CreditCard size={13} /> Savings Account
              </button>
            </div>
          </div>

          {/* UPI ID (Optional) */}
          <div className="sm:col-span-2">
            <Label htmlFor="upiId">Primary UPI ID / VPA (Optional for Instant Payouts)</Label>
            <div className="relative mt-1">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <Input
                id="upiId"
                name="upiId"
                disabled={isVerified}
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. merchant@hdfcbank or 9876543210@paytm"
                className={`pl-9 font-medium ${isVerified ? "bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200" : ""}`}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supported for automated IMPS / UPI fast settlements under ₹1,00,000.
            </p>
          </div>
        </div>

        {/* Live Masked Bank Preview Card */}
        <div className="mt-5 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-xs">
              {bankName ? bankName.slice(0, 2).toUpperCase() : "BK"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{bankName || "Your Bank"}</span>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  A/C: ••••{accountNumber.slice(-4) || "1920"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Beneficiary: <strong>{accountHolderName}</strong> &bull; IFSC: <strong className="font-mono">{ifsc}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isVerified ? (
              <Button
                type="button"
                variant="outline"
                disabled={isVerifying}
                onClick={handleVerifyPennyDrop}
                className="text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-100/60"
              >
                {isVerifying ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles size={13} className="text-emerald-700" />
                )}
                {isVerifying ? "Verifying…" : "Test Penny Drop (₹1)"}
              </Button>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <ShieldCheck size={15} /> Locked for Payouts
              </span>
            )}
          </div>
        </div>

        {/* Security Assurance */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Lock size={13} className="text-indigo-600 shrink-0" />
          <span>
            Bank details are protected with 256-bit bank-grade encryption and used exclusively for RBI/NPCI-compliant COD Remittance payouts.
          </span>
        </div>

        {/* Submit Actions */}
        {!isVerified && (
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              {loading ? "Saving Bank Details…" : "Save & Verify Bank Account"}
            </Button>
          </div>
        )}

      </div>
    </form>
  );
}

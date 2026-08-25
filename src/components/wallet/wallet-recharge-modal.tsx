"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Plus, ShieldCheck, Sparkles, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { launchRazorpayRecharge } from "@/lib/finance/razorpay-client";
import { formatINR } from "@/lib/calculations";

export function WalletRechargeModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(2000);
  const [loading, setLoading] = useState(false);

  const presets = [1, 500, 1000, 2000, 5000];

  async function handleRecharge() {
    if (!amount || isNaN(amount) || amount < 1) {
      toast.error("Please enter a valid recharge amount (minimum ₹1).");
      return;
    }

    setLoading(true);

    const launched = await launchRazorpayRecharge({
      amount,
      onSuccess: () => {
        setLoading(false);
        toast.success(`Successfully recharged ${formatINR(amount)} via Razorpay!`);
        setOpen(false);
        router.refresh();
      },
      onError: (errMsg) => {
        setLoading(false);
        console.error("Razorpay error:", errMsg);
      },
      onClose: () => {
        setLoading(false);
      },
    });

    if (!launched) {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
      >
        <Plus size={15} /> Add Money to Wallet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Wallet size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Prepaid Wallet Topup</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Recharge Amount (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>


              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Popular Recharge Amounts
                </label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(p)}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
                        amount === p
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {formatINR(p)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/70 text-xs text-slate-600 flex items-start gap-2">
                <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Instant recharge via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, or Net Banking.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || amount <= 0}
                onClick={handleRecharge}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                {loading ? "Processing…" : `Proceed to Pay ${formatINR(amount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

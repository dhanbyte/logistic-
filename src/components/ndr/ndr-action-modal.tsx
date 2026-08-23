"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, RotateCcw, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { resolveNdrAction } from "@/app/ecommerce-actions";
import type { NdrCase } from "@/types";

export function NdrActionModal({ ndr }: { ndr: NdrCase }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"REATTEMPT" | "CHANGE_ADDRESS" | "RTO">("REATTEMPT");
  const [reattemptDate, setReattemptDate] = useState<string>(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
  );
  const [remark, setRemark] = useState("Customer confirmed availability for delivery tomorrow");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await resolveNdrAction(ndr.id, action, reattemptDate, remark);
    setLoading(false);

    if (res.ok) {
      toast.success(
        action === "RTO"
          ? "RTO instruction sent to courier partner."
          : "Delivery reattempt scheduled successfully!",
      );
      setOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs"
      >
        Resolve NDR
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Resolve Delivery Exception</h3>
                  <p className="text-xs text-slate-500">NDR Attempt #{ndr.attemptNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Choose Action for Courier Rider
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="action"
                      checked={action === "REATTEMPT"}
                      onChange={() => setAction("REATTEMPT")}
                      className="text-indigo-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Re-attempt Delivery</p>
                      <p className="text-[11px] text-slate-500">Customer was contacted and confirmed readiness</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="action"
                      checked={action === "RTO"}
                      onChange={() => setAction("RTO")}
                      className="text-indigo-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-rose-900">Return to Origin (RTO)</p>
                      <p className="text-[11px] text-slate-500">Customer rejected / cancelled order</p>
                    </div>
                  </label>
                </div>
              </div>

              {action === "REATTEMPT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Reattempt Date
                  </label>
                  <input
                    type="date"
                    required
                    value={reattemptDate}
                    onChange={(e) => setReattemptDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Courier Remark / Instructions
                </label>
                <textarea
                  rows={2}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-indigo-600 focus:outline-none"
                  placeholder="e.g. Buyer asked to call on alternate number 9811223344"
                />
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
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {loading && <Loader2 className="size-3.5 animate-spin" />}
                  {loading ? "Submitting…" : "Transmit Action to Courier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

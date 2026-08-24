"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  Banknote,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/calculations";
import { approveRemittanceAction, rejectRemittanceAction } from "@/app/admin-actions";

export default function AdminRemittancePage() {
  const [loading, setLoading] = useState(false);
  const [utrModal, setUtrModal] = useState<{ open: boolean; requestId: string; utr: string }>({
    open: false,
    requestId: "",
    utr: "",
  });

  const [requests, setRequests] = useState([
    {
      id: "rem-req-01",
      userId: "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5",
      userName: "Dhananjay (Dhanbyte Logistics)",
      amount: 15000,
      bankAccount: "50200049281920",
      ifsc: "HDFC0001234",
      beneficiary: "Dhananjay",
      processingFee: 15,
      gst: 2.7,
      netAmount: 14982.3,
      status: "PENDING",
      approvalLevelRequired: "OPERATIONS_ADMIN",
      requestedAt: "2026-08-24 10:15",
    },
    {
      id: "rem-req-02",
      userId: "usr-2",
      userName: "Pooja Sharma (Sharma Apparels)",
      amount: 8500,
      bankAccount: "918201920192",
      ifsc: "SBIN0004910",
      beneficiary: "Pooja Sharma",
      processingFee: 10,
      gst: 1.8,
      netAmount: 8488.2,
      status: "SUCCESS",
      approvalLevelRequired: "AUTO",
      requestedAt: "2026-08-20 14:00",
      approvedAt: "2026-08-20 14:05",
      approvedBy: "System Auto-Approval",
      bankUtr: "HDFC9821029109",
    },
  ]);

  async function handleApproveSubmit() {
    setLoading(true);
    const res = await approveRemittanceAction(utrModal.requestId, utrModal.utr || undefined);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === utrModal.requestId
            ? { ...r, status: "SUCCESS", bankUtr: utrModal.utr || "NEFT" + Date.now() }
            : r,
        ),
      );
      setUtrModal({ open: false, requestId: "", utr: "" });
    } else {
      toast.error(res.message);
    }
  }

  async function handleReject(r: any) {
    const reason = window.prompt("Enter rejection reason for shipper:");
    if (!reason) return;

    setLoading(true);
    const res = await rejectRemittanceAction(r.id, r.userId, r.amount, reason);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message);
      setRequests((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, status: "FAILED" } : item)),
      );
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Bank Remittance &amp; Payout Approval</h1>
        <p className="text-xs text-slate-500">
          Review seller withdrawal requests, verify bank account details and release payout funds with NEFT/IMPS UTRs.
        </p>
      </div>

      {/* Threshold Config Rules Card */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs text-slate-700 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-indigo-600 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900">Active Multi-Tier Security Approval Limits</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              <strong>Tier 1 (&le; ₹10,000):</strong> Instant Auto-Approval &bull;{" "}
              <strong>Tier 2 (₹10,001–₹50,000):</strong> Operations Admin Approval &bull;{" "}
              <strong>Tier 3 (&gt; ₹50,000):</strong> Super Admin 2FA Approval
            </p>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Request ID &amp; Time</th>
                <th className="py-3 px-4">Shipper / User</th>
                <th className="py-3 px-4">Bank &amp; IFSC Details</th>
                <th className="py-3 px-4">Gross &amp; Fee</th>
                <th className="py-3 px-4 font-bold">Net Payout Amount</th>
                <th className="py-3 px-4">Approval Tier</th>
                <th className="py-3 px-4">Status &amp; UTR</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-slate-900">{r.id}</p>
                    <p className="text-[11px] text-slate-400">{r.requestedAt}</p>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {r.userName}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-slate-800">{r.bankAccount}</p>
                    <p className="text-[11px] text-slate-500">{r.ifsc} ({r.beneficiary})</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-700">{formatINR(r.amount)}</p>
                    <p className="text-[10px] text-slate-400">
                      Fee: {formatINR(r.processingFee)} + {formatINR(r.gst)} GST
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-black text-sm text-emerald-700">{formatINR(r.netAmount)}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {r.approvalLevelRequired}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        r.status === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "FAILED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.bankUtr && (
                      <p className="font-mono text-[10px] text-slate-500 font-bold mt-0.5">
                        UTR: {r.bankUtr}
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {r.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setUtrModal({ open: true, requestId: r.id, utr: "" })}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                        >
                          Approve Payout
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(r)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs font-semibold">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UTR Input Modal */}
      {uttrModalOpen(utrModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Approve &amp; Settle Bank Remittance</h3>
              <button
                onClick={() => setUtrModal({ open: false, requestId: "", utr: "" })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Bank Transfer UTR / Transaction Reference *
              </label>
              <input
                type="text"
                required
                value={utrModal.utr}
                onChange={(e) => setUtrModal((prev) => ({ ...prev, utr: e.target.value }))}
                placeholder="e.g. HDFC98210291039 or IMPS99210291"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Approving will deduct the held amount from escrow and notify the user with the UTR number.
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setUtrModal({ open: false, requestId: "", utr: "" })}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleApproveSubmit}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loading ? "Processing…" : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function uttrModalOpen(modal: { open: boolean }) {
  return modal.open;
}

"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  FileCheck,
  FileText,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { updateKycStatusAction } from "@/app/admin-actions";

export default function AdminKycPage() {
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; userId: string; reason: string }>({
    open: false,
    userId: "",
    reason: "",
  });

  const sampleKycRecords = [
    {
      id: "kyc-01",
      userId: "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5",
      userName: "Dhananjay (Dhanbyte Logistics)",
      email: "dhananjay.win2004@gmail.com",
      phone: "+91 98765 43210",
      companyName: "Dhanbyte Logistics Pvt Ltd",
      panNumber: "ABCDE1234F",
      gstin: "24AAACG1234A1Z5",
      bankAccount: "50200049281920",
      ifsc: "HDFC0001234",
      holderName: "Dhananjay",
      status: "APPROVED",
      submittedAt: "2026-08-23 18:30",
    },
    {
      id: "kyc-02",
      userId: "usr-2",
      userName: "Pooja Sharma",
      email: "pooja.retail@gmail.com",
      phone: "+91 98112 23344",
      companyName: "Sharma Apparels & Fashion",
      panNumber: "BKMPA9921D",
      gstin: "27BKMPA9921D1Z2",
      bankAccount: "918201920192",
      ifsc: "SBIN0004910",
      holderName: "Pooja Sharma",
      status: "PENDING",
      submittedAt: "2026-08-24 11:20",
    },
  ];

  async function handleApprove(userId: string) {
    setLoading(true);
    const res = await updateKycStatusAction(userId, "APPROVED");
    setLoading(false);
    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  async function handleRejectSubmit() {
    if (!rejectModal.reason.trim()) {
      toast.error("Please enter a reason for rejection.");
      return;
    }

    setLoading(true);
    const res = await updateKycStatusAction(
      rejectModal.userId,
      "REJECTED",
      rejectModal.reason,
    );
    setLoading(false);
    if (res.ok) {
      toast.success("KYC Rejected with notification sent.");
      setRejectModal({ open: false, userId: "", reason: "" });
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">KYC Verification &amp; Document Review</h1>
        <p className="text-xs text-slate-500">
          Verify government identifiers, verified bank accounts and business registrations for legal compliance.
        </p>
      </div>

      {/* KYC Cards */}
      <div className="space-y-4">
        {sampleKycRecords.map((k) => (
          <div
            key={k.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">{k.companyName}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      k.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : k.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}
                  >
                    {k.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contact: {k.userName} &bull; {k.email} &bull; {k.phone}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {k.status === "PENDING" && (
                  <>
                    <button
                      disabled={loading}
                      onClick={() => handleApprove(k.userId)}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={15} /> Approve KYC
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => setRejectModal({ open: true, userId: k.userId, reason: "" })}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </>
                )}

                {k.status === "APPROVED" && (
                  <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Verified &amp; Active
                  </span>
                )}
              </div>
            </div>

            {/* Document Details Grid */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold block">Company PAN</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">{k.panNumber}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">● NSDL Verified</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold block">GSTIN Number</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">{k.gstin}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">● GST Portal Active</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold block">Bank Account &amp; IFSC</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">{k.bankAccount}</p>
                <p className="text-[10px] text-slate-500">{k.ifsc} ({k.holderName})</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold block">Document Proofs</span>
                <div className="mt-1 flex items-center gap-2">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info("Opening Certificate of Incorporation...");
                    }}
                    className="rounded bg-white border border-slate-200 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <FileText size={12} /> GST Cert.
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info("Opening Bank Cheque Proof...");
                    }}
                    className="rounded bg-white border border-slate-200 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <FileCheck size={12} /> Cheque
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Reject KYC Verification</h3>
              <button
                onClick={() => setRejectModal({ open: false, userId: "", reason: "" })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-500">
                Please provide specific feedback for the shipper so they can re-upload valid documents.
              </p>
              <textarea
                rows={3}
                required
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Bank account name mismatch with PAN card name. Please upload cancelled cheque."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setRejectModal({ open: false, userId: "", reason: "" })}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleRejectSubmit}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

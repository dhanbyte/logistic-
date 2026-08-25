"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileCheck,
  FileText,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { updateKycStatusAction } from "@/app/admin-actions";
import type { AdminUserListItem } from "@/lib/data/admin/users";

interface AdminKycClientProps {
  users: AdminUserListItem[];
}

export function AdminKycClient({ users }: AdminKycClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; userId: string; reason: string }>({
    open: false,
    userId: "",
    reason: "",
  });

  async function handleApprove(userId: string) {
    setLoading(true);
    const res = await updateKycStatusAction(userId, "APPROVED");
    setLoading(false);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
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
      toast.success("KYC status updated to REJECTED.");
      setRejectModal({ open: false, userId: "", reason: "" });
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-4">
      {users.map((k) => (
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
                    k.kycStatus === "VERIFIED"
                      ? "bg-emerald-100 text-emerald-800"
                      : k.kycStatus === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800 animate-pulse"
                  }`}
                >
                  {k.kycStatus === "VERIFIED" ? "APPROVED" : k.kycStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Contact: {k.name} &bull; <span className="font-mono text-slate-600">{k.email}</span> &bull; {k.phone}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {k.kycStatus === "PENDING" && (
                <>
                  <button
                    disabled={loading}
                    onClick={() => handleApprove(k.id)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} /> Approve KYC
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => setRejectModal({ open: true, userId: k.id, reason: "" })}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </>
              )}

              {k.kycStatus === "VERIFIED" && (
                <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Verified &amp; Active
                </span>
              )}

              {k.kycStatus === "REJECTED" && (
                <span className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <XCircle size={16} /> Rejected
                </span>
              )}
            </div>
          </div>

          {/* Document Details Grid */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500 font-semibold block">Business Name / Entity</span>
              <p className="font-bold text-slate-900 mt-0.5 text-sm">{k.companyName}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">● Registered Shipper</span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500 font-semibold block">GSTIN Status</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">{k.gstStatus}</p>
              <span className="text-[10px] text-indigo-600 font-semibold">● E-Way Bill Ready</span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500 font-semibold block">Account Holder &amp; Phone</span>
              <p className="font-bold text-slate-900 mt-0.5 text-sm">{k.name}</p>
              <p className="text-[10px] text-slate-500">{k.phone}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500 font-semibold block">KYC Verification Status</span>
              <p className="font-bold text-emerald-700 mt-0.5 text-sm">{k.kycStatus === "VERIFIED" ? "Verified" : k.kycStatus}</p>
              <span className="text-[10px] text-slate-500">Joined: {k.createdAt}</span>
            </div>
          </div>
        </div>
      ))}

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
                Please provide specific feedback for the shipper so they can update valid details.
              </p>
              <textarea
                rows={3}
                required
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Invalid GSTIN or bank account name mismatch."
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

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Loader2,
  Package,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  approveCodSettlementAction,
  executeCodBankPayoutAction,
  holdCodSettlementAction,
  rejectCodSettlementAction,
  retryCodPayoutAction,
  submitSettlementForApprovalAction,
} from "@/app/cod-actions";
import { formatINR } from "@/lib/calculations";
import { generateCodSettlementCsv } from "@/lib/export/cod-csv";
import type { CodSettlementBatch } from "@/types/finance";

interface AdminCodSettlementManagerProps {
  batches: CodSettlementBatch[];
  kpis: {
    pendingCod: number;
    upcoming: number;
    payableToday: number;
    awaitingApproval: number;
    approved: number;
    processing: number;
    paid: number;
    failed: number;
    totalPayable: number;
    totalPaid: number;
  };
}

export function AdminCodSettlementManager({
  batches: initialBatches,
  kpis,
}: AdminCodSettlementManagerProps) {
  const [batches, setBatches] = useState<CodSettlementBatch[]>(initialBatches);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected Batch for Two-Level Approval & Payout Modal
  const [selectedBatch, setSelectedBatch] = useState<CodSettlementBatch | null>(null);

  // Bank Payout Execution Form State
  const [bankUtr, setBankUtr] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [actualPaidAmount, setActualPaidAmount] = useState<number | "">("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Filtered Batches
  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      searchTerm === "" ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.settlementDate.includes(searchTerm) ||
      (b.bankUtr && b.bankUtr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.userName && b.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      b.orders.some(
        (o) =>
          o.awbNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesStatus =
      statusFilter === "ALL" ||
      b.status === statusFilter ||
      (statusFilter === "PAYABLE" && (b.status === "PAYABLE" || b.status === "AWAITING_APPROVAL" || b.status === "APPROVED"));

    return matchesSearch && matchesStatus;
  });

  // Action Handlers
  async function handleSubmitForApproval(batchId: string) {
    setActionLoading(true);
    const res = await submitSettlementForApprovalAction(batchId, "Finance Admin");
    setActionLoading(false);

    if (res.ok) {
      toast.success(res.message);
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId ? { ...b, status: "AWAITING_APPROVAL", reviewedBy: "Finance Admin" } : b,
        ),
      );
      if (selectedBatch?.id === batchId) {
        setSelectedBatch((prev) =>
          prev ? { ...prev, status: "AWAITING_APPROVAL", reviewedBy: "Finance Admin" } : null,
        );
      }
    } else {
      toast.error(res.message);
    }
  }

  async function handleApprove(batchId: string) {
    setActionLoading(true);
    const res = await approveCodSettlementAction(batchId, "Super Admin");
    setActionLoading(false);

    if (res.ok) {
      toast.success(res.message);
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId ? { ...b, status: "APPROVED", approvedBy: "Super Admin" } : b,
        ),
      );
      if (selectedBatch?.id === batchId) {
        setSelectedBatch((prev) =>
          prev ? { ...prev, status: "APPROVED", approvedBy: "Super Admin" } : null,
        );
      }
    } else {
      toast.error(res.message);
    }
  }

  async function handleReject(batchId: string) {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }

    setActionLoading(true);
    const res = await rejectCodSettlementAction(batchId, rejectReason);
    setActionLoading(false);

    if (res.ok) {
      toast.success(res.message);
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId ? { ...b, status: "FAILED", failureReason: rejectReason } : b,
        ),
      );
      setSelectedBatch(null);
      setShowRejectInput(false);
      setRejectReason("");
    } else {
      toast.error(res.message);
    }
  }

  async function handleHold(batchId: string) {
    setActionLoading(true);
    const res = await holdCodSettlementAction(batchId, "Under review by compliance");
    setActionLoading(false);

    if (res.ok) {
      toast.success(res.message);
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId ? { ...b, status: "ON_HOLD", failureReason: "Under review" } : b,
        ),
      );
      if (selectedBatch?.id === batchId) {
        setSelectedBatch((prev) => (prev ? { ...prev, status: "ON_HOLD" } : null));
      }
    } else {
      toast.error(res.message);
    }
  }

  async function handleExecutePayout(batch: CodSettlementBatch) {
    if (!bankUtr.trim() || bankUtr.trim().length < 6) {
      toast.error("Please enter a valid Bank UTR reference number (min 6 characters).");
      return;
    }

    const paidAmt = actualPaidAmount !== "" ? Number(actualPaidAmount) : batch.netPayable;

    setActionLoading(true);
    const res = await executeCodBankPayoutAction({
      batchId: batch.id,
      bankUtr: bankUtr.trim().toUpperCase(),
      paymentDate,
      paymentMode,
      actualPaidAmount: paidAmt,
    });
    setActionLoading(false);

    if (res.ok) {
      toast.success(res.message);
      const isReconciled = Math.abs(paidAmt - batch.netPayable) < 0.01;
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batch.id
            ? {
                ...b,
                status: "PAID",
                bankUtr: bankUtr.trim().toUpperCase(),
                paymentDate,
                paymentMode,
                isReconciled,
                reconciliationDiff: Math.round((batch.netPayable - paidAmt) * 100) / 100,
              }
            : b,
        ),
      );
      setSelectedBatch(null);
      setBankUtr("");
    } else {
      toast.error(res.message);
    }
  }

  async function handleRetry(batchId: string) {
    setActionLoading(true);
    const res = await retryCodPayoutAction(batchId);
    setActionLoading(false);

    if (res.ok) {
      toast.success(res.message);
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, status: "APPROVED", failureReason: undefined } : b)),
      );
      if (selectedBatch?.id === batchId) {
        setSelectedBatch((prev) =>
          prev ? { ...prev, status: "APPROVED", failureReason: undefined } : null,
        );
      }
    } else {
      toast.error(res.message);
    }
  }

  function handleDownloadExcel(batchList: CodSettlementBatch[], filename = "Admin_COD_Settlements.csv") {
    try {
      const csv = generateCodSettlementCsv(batchList);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel reconciliation file downloaded successfully!");
    } catch {
      toast.error("Failed to export Excel file.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Banknote className="size-5 text-emerald-600" />
            COD Remittance &amp; Bank Settlement Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Two-Level Approval: Finance Admin Review &rarr; Super Admin Approval &rarr; Bank UTR Execution &rarr; Reconciliation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleDownloadExcel(batches)}
          className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet size={15} /> Export All Settlements (Excel)
        </button>
      </div>

      {/* 10 Admin KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pending COD</span>
          <p className="mt-1 text-lg font-black text-slate-900">{formatINR(kpis.pendingCod)}</p>
          <p className="text-[10px] text-slate-400">In-field cash</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Upcoming</span>
          <p className="mt-1 text-lg font-black text-amber-900">{formatINR(kpis.upcoming)}</p>
          <p className="text-[10px] text-amber-700">Scheduled T+2</p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">Payable Today</span>
          <p className="mt-1 text-lg font-black text-indigo-900">{formatINR(kpis.payableToday)}</p>
          <p className="text-[10px] text-indigo-700">Due for payout</p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">Awaiting Approval</span>
          <p className="mt-1 text-lg font-black text-sky-900">{kpis.awaitingApproval} Batches</p>
          <p className="text-[10px] text-sky-700">Needs Super Admin</p>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">Approved</span>
          <p className="mt-1 text-lg font-black text-teal-900">{kpis.approved} Batches</p>
          <p className="text-[10px] text-teal-700">Ready for Bank UTR</p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">Processing</span>
          <p className="mt-1 text-lg font-black text-purple-900">{kpis.processing} Batches</p>
          <p className="text-[10px] text-purple-700">NEFT in flight</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Paid Batches</span>
          <p className="mt-1 text-lg font-black text-emerald-700">{kpis.paid} Paid</p>
          <p className="text-[10px] text-emerald-700">UTR attached</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">Failed Payouts</span>
          <p className="mt-1 text-lg font-black text-rose-700">{kpis.failed} Failed</p>
          <p className="text-[10px] text-rose-600">Needs retry/fix</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Payable</span>
          <p className="mt-1 text-lg font-black text-slate-900">{formatINR(kpis.totalPayable)}</p>
          <p className="text-[10px] text-slate-400">All pending escrow</p>
        </div>

        <div className="rounded-2xl border border-emerald-300 bg-emerald-100/50 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">Total Remitted</span>
          <p className="mt-1 text-lg font-black text-emerald-800">{formatINR(kpis.totalPaid)}</p>
          <p className="text-[10px] text-emerald-700">Lifetime bank payouts</p>
        </div>
      </div>

      {/* Main Settlement Queue Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
            <input
              type="text"
              placeholder="Search by Batch ID, User, AWB, or UTR…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            {["ALL", "AWAITING_APPROVAL", "APPROVED", "PAYABLE", "PAID", "ON_HOLD", "FAILED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredBatches.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Package className="mx-auto size-10 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-bold text-slate-700">No settlement batches in queue</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Settlement Batch</th>
                  <th className="py-3 px-4">Shipper / User</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">COD Collected</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4 font-bold text-emerald-800">Net Payable</th>
                  <th className="py-3 px-4">Settlement Date</th>
                  <th className="py-3 px-4">Status &amp; UTR</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-slate-900">{b.id}</p>
                      <p className="text-[10px] text-slate-400">Ref: {b.batchReference}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{b.userName || "Merchant Shipper"}</p>
                      <p className="font-mono text-[10px] text-slate-400">A/C: •••• {b.bankAccountLast4}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedBatch(b)}
                        className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {b.orderCount} Orders
                        <Eye size={11} />
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(b.totalCodCollected)}</td>

                    <td className="py-3.5 px-4 text-rose-600 font-medium">
                      −{formatINR(b.totalDeductions)}
                    </td>

                    <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                      {formatINR(b.netPayable)}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{b.settlementDate}</p>
                      <p className="text-[10px] text-slate-400">T+2 Delivery</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          b.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "APPROVED"
                            ? "bg-teal-100 text-teal-800"
                            : b.status === "AWAITING_APPROVAL"
                            ? "bg-sky-100 text-sky-800"
                            : b.status === "FAILED"
                            ? "bg-rose-100 text-rose-800"
                            : b.status === "ON_HOLD"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {b.status.replace(/_/g, " ")}
                      </span>
                      {b.bankUtr && (
                        <p className="font-mono text-[10px] text-slate-700 font-bold mt-0.5">
                          UTR: {b.bankUtr}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBatch(b);
                            setActualPaidAmount(b.netPayable);
                          }}
                          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadExcel([b], `Settlement_${b.id}.csv`)}
                          title="Download Excel"
                          className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* TWO-LEVEL REVIEW & APPROVAL MODAL */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    COD Settlement Review: {selectedBatch.id}
                  </h3>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
                    {selectedBatch.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  User: <strong className="text-slate-800">{selectedBatch.userName}</strong> &bull; Settlement Date: <strong className="text-slate-800">{selectedBatch.settlementDate}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedBatch(null);
                  setShowRejectInput(false);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Financial Summary & Bank Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              {/* Financial Deductions Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <IndianRupee size={15} className="text-emerald-700" />
                  Financial Calculation
                </h4>
                <div className="flex justify-between text-slate-600">
                  <span>Gross COD Collected ({selectedBatch.orderCount} Orders):</span>
                  <span className="font-bold text-slate-900">{formatINR(selectedBatch.totalCodCollected)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Courier Freight Deductions:</span>
                  <span className="font-semibold text-rose-700">−{formatINR(selectedBatch.totalFreight)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>COD Cash Handling Fee &amp; GST:</span>
                  <span className="font-semibold text-rose-700">−{formatINR(selectedBatch.totalCodFees + selectedBatch.totalTaxes)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Other Applicable Charges:</span>
                  <span className="font-semibold text-slate-700">−{formatINR(selectedBatch.otherCharges)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Net Payable Amount:</span>
                  <span className="text-emerald-700 font-black">{formatINR(selectedBatch.netPayable)}</span>
                </div>
              </div>

              {/* Verified Bank Box */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 text-xs">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Building2 size={15} className="text-emerald-700" />
                  Beneficiary Bank Account
                </h4>
                <div className="flex justify-between text-slate-600">
                  <span>Account Holder:</span>
                  <span className="font-bold text-slate-900">{selectedBatch.accountHolderName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bank Name:</span>
                  <span className="font-semibold text-slate-800">{selectedBatch.bankName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Account Number:</span>
                  <span className="font-mono font-bold text-slate-900">•••• {selectedBatch.bankAccountLast4}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedBatch.bankIfsc}</span>
                </div>
                <div className="pt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold">
                  <ShieldCheck size={14} /> Bank Account Verified &bull; Active Beneficiary
                </div>
              </div>
            </div>

            {/* Underlying Orders List */}
            <div className="my-4">
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                Underlying Order Breakdown ({selectedBatch.orders.length} AWBs)
              </h4>
              <div className="rounded-xl border border-slate-200 max-h-48 overflow-y-auto overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Order</th>
                      <th className="py-2 px-3">AWB</th>
                      <th className="py-2 px-3">Delivered</th>
                      <th className="py-2 px-3">COD Amount</th>
                      <th className="py-2 px-3">Freight</th>
                      <th className="py-2 px-3">COD Fee</th>
                      <th className="py-2 px-3 font-bold text-emerald-800">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {selectedBatch.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono font-bold">{o.orderNumber}</td>
                        <td className="py-2 px-3 font-mono text-indigo-600">{o.awbNumber}</td>
                        <td className="py-2 px-3">{o.deliveryDate}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{formatINR(o.codAmount)}</td>
                        <td className="py-2 px-3 text-rose-600">−{formatINR(o.freightCharge)}</td>
                        <td className="py-2 px-3 text-rose-600">−{formatINR(o.codFee + o.tax)}</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">{formatINR(o.netPayable)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payout Execution Form (Visible when APPROVED or PAYABLE) */}
            {(selectedBatch.status === "APPROVED" || selectedBatch.status === "PAYABLE") && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 my-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-indigo-600" />
                  <h4 className="text-xs font-bold text-indigo-950">Execute Bank Payout &amp; Attach UTR</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Bank UTR Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC99182910"
                      value={bankUtr}
                      onChange={(e) => setBankUtr(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                    >
                      <option value="NEFT">NEFT Transfer</option>
                      <option value="IMPS">IMPS Instant</option>
                      <option value="RTGS">RTGS High-Value</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={actionLoading || !bankUtr.trim()}
                    onClick={() => handleExecutePayout(selectedBatch)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="animate-spin size-3.5" /> : <CheckCircle2 size={15} />}
                    Confirm Bank Transfer &amp; Mark PAID ({formatINR(selectedBatch.netPayable)})
                  </button>
                </div>
              </div>
            )}

            {/* Paid UTR Details */}
            {selectedBatch.status === "PAID" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 my-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={22} />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Settlement Paid &amp; Reconciled ({formatINR(selectedBatch.netPayable)})
                    </h4>
                    <p className="text-xs font-mono font-bold text-emerald-800 mt-0.5">
                      Bank UTR: {selectedBatch.bankUtr} &bull; Mode: {selectedBatch.paymentMode || "NEFT"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                  MATCHED
                </span>
              </div>
            )}

            {/* Reject Form Input if triggered */}
            {showRejectInput && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 my-4 space-y-2">
                <label className="text-xs font-bold text-rose-900 block">Rejection Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Bank IFSC mismatch or weight discrepancy pending..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(false)}
                    className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleReject(selectedBatch.id)}
                    className="rounded-lg bg-rose-700 px-3 py-1 text-xs font-bold text-white hover:bg-rose-800"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedBatch.status === "FAILED" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRetry(selectedBatch.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <RotateCcw size={14} /> Retry Payout
                  </button>
                )}

                {selectedBatch.status !== "PAID" && selectedBatch.status !== "FAILED" && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleHold(selectedBatch.id)}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                    >
                      Put on Hold
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(true)}
                      className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-100 cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Finance Admin: Submit for Approval */}
                {selectedBatch.status === "SETTLEMENT_SCHEDULED" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleSubmitForApproval(selectedBatch.id)}
                    className="rounded-xl bg-sky-700 px-4 py-2 text-xs font-bold text-white hover:bg-sky-800 transition-colors shadow-xs cursor-pointer"
                  >
                    Submit for Approval
                  </button>
                )}

                {/* Super Admin: Approve */}
                {selectedBatch.status === "AWAITING_APPROVAL" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedBatch.id)}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                  >
                    Approve Batch
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedBatch(null);
                    setShowRejectInput(false);
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

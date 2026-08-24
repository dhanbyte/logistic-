"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Info,
  Package,
  Search,
  ShieldCheck,
  TrendingUp,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/calculations";
import { generateCodSettlementCsv } from "@/lib/export/cod-csv";
import type {
  CodSettlementBatch,
  CodSettlementOrderItem,
  UserBankDetails,
} from "@/types/finance";

interface UserCodDashboardProps {
  batches: CodSettlementBatch[];
  allOrders: CodSettlementOrderItem[];
  bankDetails: UserBankDetails;
  summary: {
    pendingCodInField: number;
    upcomingSettlement: number;
    payableToday: number;
    totalRemitted: number;
    totalCodCollected: number;
    totalFreightAndFees: number;
    nextSettlementDate: string;
  };
}

export function UserCodDashboard({
  batches,
  allOrders,
  bankDetails,
  summary,
}: UserCodDashboardProps) {
  const [activeTab, setActiveTab] = useState<"batches" | "orders">("batches");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected Batch for Order Breakdown Modal
  const [selectedBatch, setSelectedBatch] = useState<CodSettlementBatch | null>(null);

  // Selected AWB for Payment Lifecycle Timeline Modal
  const [selectedOrder, setSelectedOrder] = useState<CodSettlementOrderItem | null>(null);

  // Filtered Batches
  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      searchTerm === "" ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.settlementDate.includes(searchTerm) ||
      (b.bankUtr && b.bankUtr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      b.orders.some(
        (o) =>
          o.awbNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PAID" && b.status === "PAID") ||
      (statusFilter === "PENDING" && b.status === "COD_PENDING") ||
      (statusFilter === "SCHEDULED" && b.status === "SETTLEMENT_SCHEDULED") ||
      (statusFilter === "PAYABLE" && (b.status === "PAYABLE" || b.status === "AWAITING_APPROVAL" || b.status === "APPROVED"));

    return matchesSearch && matchesStatus;
  });

  // Filtered Orders
  const filteredOrders = allOrders.filter((o) => {
    const matchesSearch =
      searchTerm === "" ||
      o.awbNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.bankUtr && o.bankUtr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.courierName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PAID" && o.status === "PAID") ||
      (statusFilter === "PENDING" && o.status === "COD_PENDING") ||
      (statusFilter === "SCHEDULED" && o.status === "SETTLEMENT_SCHEDULED") ||
      (statusFilter === "PAYABLE" && o.status === "PAYABLE");

    return matchesSearch && matchesStatus;
  });

  function handleDownloadExcel(batchList: CodSettlementBatch[], filename = "ShipWave_COD_Settlements.csv") {
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
      toast.success("Excel / CSV reconciliation report downloaded successfully!");
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
            <IndianRupee className="size-5 text-emerald-600" />
            COD Remittance &amp; Bank Settlement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated <strong>Delivery + 3 Days</strong> settlement cycle, itemized courier deductions, and bank transfer UTRs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleDownloadExcel(batches)}
          className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet size={15} /> Download All (Excel)
        </button>
      </div>

      {/* Top 6 Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Pending in Field
          </span>
          <p className="mt-2 text-xl font-black text-slate-900">{formatINR(summary.pendingCodInField)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Orders in transit</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            Upcoming Payout
          </span>
          <p className="mt-2 text-xl font-black text-amber-900">{formatINR(summary.upcomingSettlement)}</p>
          <p className="text-[10px] text-amber-700 mt-0.5">Scheduled for T+3</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block">
            Payable Today
          </span>
          <p className="mt-2 text-xl font-black text-indigo-900">{formatINR(summary.payableToday)}</p>
          <p className="text-[10px] text-indigo-700 mt-0.5">Ready for bank transfer</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
            Total Remitted
          </span>
          <p className="mt-2 text-xl font-black text-emerald-700">{formatINR(summary.totalRemitted)}</p>
          <p className="text-[10px] text-emerald-700 mt-0.5">100% paid to bank</p>
        </div>

        {/* Card 5 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Collected
          </span>
          <p className="mt-2 text-xl font-black text-slate-900">{formatINR(summary.totalCodCollected)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Gross lifetime COD</p>
        </div>

        {/* Card 6 */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
            Freight &amp; Fees
          </span>
          <p className="mt-2 text-xl font-black text-rose-700">−{formatINR(summary.totalFreightAndFees)}</p>
          <p className="text-[10px] text-rose-600 mt-0.5">Itemized deductions</p>
        </div>
      </div>

      {/* Verified Bank Account & Settlement Policy Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
            <Building2 size={22} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Beneficiary Bank: {bankDetails.bankName}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                <ShieldCheck size={11} /> Verified
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Account: <strong className="text-slate-900">{bankDetails.maskedAccountNumber}</strong> &bull; IFSC: <strong className="text-slate-900">{bankDetails.ifsc}</strong> &bull; Beneficiary: {bankDetails.accountHolderName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-600">
          <Calendar size={15} className="text-indigo-600" />
          <span>
            Cycle: <strong className="text-slate-900">Delivery + 3 Days</strong> (Auto Payout)
          </span>
        </div>
      </div>

      {/* Main Content Area: Batches vs Orders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Navigation Tabs & Search Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("batches")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "batches"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Settlement Batches ({batches.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All COD Orders &amp; AWBs ({allOrders.length})
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              <input
                type="text"
                placeholder="Search AWB, order or UTR…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-xs w-full sm:w-auto pb-1 sm:pb-0">
              {["ALL", "PAID", "PAYABLE", "SCHEDULED", "PENDING"].map((st) => (
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
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TAB 1: Settlement Batches */}
        {activeTab === "batches" && (
          <div className="overflow-x-auto">
            {filteredBatches.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package className="mx-auto size-10 text-slate-300 mb-2 stroke-1" />
                <p className="text-xs font-bold text-slate-700">No settlement batches match your filter</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ship COD orders to see Delivery + 3 Days batches automatically generated here.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="py-3 px-4">Settlement Batch</th>
                    <th className="py-3 px-4">Payout Date (T+3)</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4">COD Collected</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4 font-bold text-emerald-800">Net Payable</th>
                    <th className="py-3 px-4">Status &amp; UTR</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredBatches.map((b) => {
                    const isPaid = b.status === "PAID";
                    const isPayable = b.status === "PAYABLE";

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-slate-900">{b.id}</p>
                          <p className="text-[10px] text-slate-400">Escrow Ref: {b.batchReference}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <Calendar size={13} className="text-indigo-600" />
                            {b.settlementDate}
                          </p>
                          <p className="text-[10px] text-slate-400">Delivery + 3 Days</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedBatch(b)}
                            className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {b.orderCount} {b.orderCount === 1 ? "Order" : "Orders"}
                            <Eye size={12} />
                          </button>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {formatINR(b.totalCodCollected)}
                        </td>

                        <td className="py-3.5 px-4 text-rose-600 font-medium">
                          <p className="font-bold">−{formatINR(b.totalDeductions)}</p>
                          <p className="text-[10px] text-slate-400">
                            Freight: {formatINR(b.totalFreight)} &bull; Fee: {formatINR(b.totalCodFees + b.totalTaxes)}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                          {formatINR(b.netPayable)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : isPayable
                                ? "bg-indigo-100 text-indigo-800"
                                : b.status === "FAILED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedBatch(b)}
                              className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              View Orders
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadExcel([b], `Settlement_${b.id}.csv`)}
                              title="Download Excel"
                              className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: All COD Orders & AWBs (Itemized) */}
        {activeTab === "orders" && (
          <div className="overflow-x-auto">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package className="mx-auto size-10 text-slate-300 mb-2 stroke-1" />
                <p className="text-xs font-bold text-slate-700">No COD shipments match your search</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="py-3 px-4">Order &amp; AWB</th>
                    <th className="py-3 px-4">Courier Partner</th>
                    <th className="py-3 px-4">Delivery Date</th>
                    <th className="py-3 px-4">Settlement Date (T+3)</th>
                    <th className="py-3 px-4">COD Collected</th>
                    <th className="py-3 px-4">Freight &amp; Fees</th>
                    <th className="py-3 px-4 font-bold text-emerald-800">Net Payable</th>
                    <th className="py-3 px-4">Status &amp; UTR</th>
                    <th className="py-3 px-4 text-right">Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredOrders.map((o) => {
                    const isPaid = o.status === "PAID";

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/shipments?q=${o.awbNumber}`}
                            target="_blank"
                            className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            {o.awbNumber}
                            <ExternalLink size={10} />
                          </Link>
                          <p className="text-[10px] text-slate-400 font-medium">{o.orderNumber}</p>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">{o.courierName}</td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{o.deliveryDate}</p>
                          <p className="text-[10px] text-slate-400">Courier POD</p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-indigo-700">{o.settlementDate}</p>
                          <p className="text-[10px] text-slate-400">Delivery + 3 Days</p>
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatINR(o.codAmount)}
                        </td>

                        <td className="py-3 px-4 text-rose-600 font-medium">
                          <p className="font-bold">−{formatINR(o.freightCharge + o.codFee + o.tax + o.otherCharges)}</p>
                          <p className="text-[10px] text-slate-400">
                            Freight: {formatINR(o.freightCharge)} &bull; Fee: {formatINR(o.codFee + o.tax)}
                          </p>
                        </td>

                        <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                          {formatINR(o.netPayable)}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : o.status === "PAYABLE"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {o.status.replace(/_/g, " ")}
                          </span>
                          {o.bankUtr && (
                            <p className="font-mono text-[10px] text-slate-600 mt-0.5 font-bold">
                              UTR: {o.bankUtr}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Timeline
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Expandable Batch Order Breakdown */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Settlement Batch: {selectedBatch.id}
                  </h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    {selectedBatch.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Payout Scheduled: <strong className="text-slate-800">{selectedBatch.settlementDate}</strong> &bull; Total Orders: <strong className="text-slate-800">{selectedBatch.orderCount}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadExcel([selectedBatch], `Settlement_${selectedBatch.id}.csv`)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  <Download size={13} /> Export Batch
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Batch Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[11px] text-slate-500">Gross COD Collected:</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{formatINR(selectedBatch.totalCodCollected)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[11px] text-slate-500">Courier Freight:</span>
                <p className="text-base font-bold text-rose-700 mt-0.5">−{formatINR(selectedBatch.totalFreight)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[11px] text-slate-500">COD Fees &amp; GST:</span>
                <p className="text-base font-bold text-rose-700 mt-0.5">−{formatINR(selectedBatch.totalCodFees + selectedBatch.totalTaxes)}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-semibold">Net Bank Payout:</span>
                <p className="text-base font-black text-emerald-700 mt-0.5">{formatINR(selectedBatch.netPayable)}</p>
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">AWB Number</th>
                    <th className="py-2.5 px-3">Courier</th>
                    <th className="py-2.5 px-3">Delivered</th>
                    <th className="py-2.5 px-3">COD Amount</th>
                    <th className="py-2.5 px-3">Freight</th>
                    <th className="py-2.5 px-3">COD Fee</th>
                    <th className="py-2.5 px-3 font-bold text-emerald-800">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {selectedBatch.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-2.5 px-3">
                        <Link
                          href={`/shipments?q=${o.awbNumber}`}
                          target="_blank"
                          className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          {o.awbNumber} <ExternalLink size={10} />
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">{o.courierName}</td>
                      <td className="py-2.5 px-3">{o.deliveryDate}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{formatINR(o.codAmount)}</td>
                      <td className="py-2.5 px-3 text-rose-600">−{formatINR(o.freightCharge)}</td>
                      <td className="py-2.5 px-3 text-rose-600">−{formatINR(o.codFee + o.tax)}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-700">{formatINR(o.netPayable)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AWB Payment Lifecycle Timeline */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Clock size={16} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Payment Lifecycle</h4>
                  <p className="text-[10px] text-slate-400 font-mono">AWB: {selectedOrder.awbNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Visual Step Timeline */}
            <div className="my-5 relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Step 1: Order Created */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 size-3.5 rounded-full border-2 border-white ring-2 bg-emerald-500 ring-emerald-200" />
                <p className="text-xs font-bold text-slate-900">COD Order Booked &amp; Dispatched</p>
                <p className="text-[11px] text-slate-500">AWB {selectedOrder.awbNumber} via {selectedOrder.courierName}</p>
              </div>

              {/* Step 2: Delivered */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 size-3.5 rounded-full border-2 border-white ring-2 bg-emerald-500 ring-emerald-200" />
                <p className="text-xs font-bold text-slate-900">Delivered &amp; Cash Collected</p>
                <p className="text-[11px] text-slate-500">
                  {selectedOrder.deliveryDate} &bull; Collected: {formatINR(selectedOrder.codAmount)}
                </p>
              </div>

              {/* Step 3: T+3 Assigned */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 size-3.5 rounded-full border-2 border-white ring-2 bg-indigo-500 ring-indigo-200" />
                <p className="text-xs font-bold text-slate-900">Delivery + 3 Days Settlement Scheduled</p>
                <p className="text-[11px] text-indigo-700 font-semibold">
                  Payout Target: {selectedOrder.settlementDate}
                </p>
              </div>

              {/* Step 4: Approved & Paid */}
              <div className="relative">
                <span
                  className={`absolute -left-6 top-0.5 size-3.5 rounded-full border-2 border-white ring-2 ${
                    selectedOrder.status === "PAID"
                      ? "bg-emerald-500 ring-emerald-200"
                      : "bg-slate-300 ring-slate-100"
                  }`}
                />
                <p className="text-xs font-bold text-slate-900">
                  {selectedOrder.status === "PAID" ? "Bank Transfer Completed" : "Bank Payout in Queue"}
                </p>
                <p className="text-[11px] text-slate-500">
                  Net Amount: <strong className="text-emerald-700">{formatINR(selectedOrder.netPayable)}</strong>
                  {selectedOrder.bankUtr && ` • UTR: ${selectedOrder.bankUtr}`}
                </p>
              </div>
            </div>

            {/* Bank Payout Details */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Beneficiary Account:</span>
                <span className="font-mono font-bold text-slate-800">{bankDetails.maskedAccountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>IFSC Code:</span>
                <span className="font-mono font-bold text-slate-800">{bankDetails.ifsc}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                <span>Net Credited to Bank:</span>
                <span className="text-emerald-700 font-black">{formatINR(selectedOrder.netPayable)}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

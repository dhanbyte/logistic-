"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Info,
  Loader2,
  Package,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Truck,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { rechargeWallet } from "@/app/ecommerce-actions";
import { launchRazorpayRecharge } from "@/lib/finance/razorpay-client";
import { formatINR } from "@/lib/calculations";
import type { WalletTransaction } from "@/types";

interface SimpleWalletViewProps {
  userId?: string;
  availableBalance: number;
  pendingCod: number;
  totalUsed: number;
  isLowBalance: boolean;
  transactions: WalletTransaction[];
}

export function SimpleWalletView({
  userId,
  availableBalance,
  pendingCod,
  totalUsed,
  isLowBalance,
  transactions,
}: SimpleWalletViewProps) {

  const router = useRouter();

  // Optimistic Local States
  const [localBalance, setLocalBalance] = useState(availableBalance);
  const [localTransactions, setLocalTransactions] = useState(transactions);

  useEffect(() => {
    setLocalBalance(availableBalance);
  }, [availableBalance]);

  useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);

  // Recharge Modal State
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "NET_BANKING" | "CARD">("UPI");
  const [rechargeLoading, setRechargeLoading] = useState(false);

  // Selected Transaction for Itemized Breakdown Modal
  const [selectedTxn, setSelectedTxn] = useState<WalletTransaction | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const presets = [500, 1000, 2000, 5000, 10000];

  // Filter Transactions
  const filteredTransactions = localTransactions.filter((t) => {
    // 1. Search Query
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.id.toLowerCase().includes(query) ||
      (t.referenceId && t.referenceId.toLowerCase().includes(query)) ||
      (t.awbNumber && t.awbNumber.toLowerCase().includes(query)) ||
      (t.orderNumber && t.orderNumber.toLowerCase().includes(query)) ||
      (t.description && t.description.toLowerCase().includes(query));

    // 2. Category Filter
    let matchesCategory = true;
    if (categoryFilter === "RECHARGE") {
      matchesCategory = t.category === "WALLET_RECHARGE" || t.transactionType === "CREDIT";
    } else if (categoryFilter === "SHIPPING") {
      matchesCategory = t.category === "SHIPPING_CHARGE" || t.category === "SHIPPING_DEDUCTION";
    } else if (categoryFilter === "REFUND") {
      matchesCategory = t.category === "CANCELLATION_REFUND" || t.category === "REFUND";
    } else if (categoryFilter === "COD") {
      matchesCategory = t.category === "COD_SETTLEMENT" || t.category === "COD_REMITTANCE";
    } else if (categoryFilter === "RTO") {
      matchesCategory = t.category === "RTO_CHARGE";
    } else if (categoryFilter === "NDR") {
      matchesCategory = t.category === "NDR_CHARGE";
    } else if (categoryFilter === "MANUAL") {
      matchesCategory = t.category === "MANUAL_CREDIT" || t.category === "MANUAL_DEBIT" || t.category === "ADJUSTMENT";
    } else if (categoryFilter !== "ALL") {
      matchesCategory = t.category === categoryFilter;
    }

    // 3. Date Filter
    let matchesDate = true;
    if (dateFilter !== "ALL" && t.createdAt) {
      const txnDate = new Date(t.createdAt).getTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (dateFilter === "TODAY") {
        matchesDate = now - txnDate <= oneDay;
      } else if (dateFilter === "YESTERDAY") {
        matchesDate = now - txnDate > oneDay && now - txnDate <= 2 * oneDay;
      } else if (dateFilter === "LAST_7_DAYS") {
        matchesDate = now - txnDate <= 7 * oneDay;
      } else if (dateFilter === "LAST_30_DAYS") {
        matchesDate = now - txnDate <= 30 * oneDay;
      }
    }

    // 4. Status Filter
    let matchesStatus = true;
    if (statusFilter !== "ALL") {
      // In production all recorded ledger entries are Completed/Success unless flagged
      matchesStatus = statusFilter === "COMPLETED";
    }

    return matchesSearch && matchesCategory && matchesDate && matchesStatus;
  });

  // Calculate Filter Summary
  const totalCredits = filteredTransactions
    .filter((t) => t.transactionType === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = filteredTransactions
    .filter((t) => t.transactionType === "DEBIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = filteredTransactions
    .filter((t) => t.category === "CANCELLATION_REFUND" || t.category === "REFUND")
    .reduce((sum, t) => sum + t.amount, 0);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  async function handleRecharge() {
    const finalAmount = customAmount ? Number(customAmount) : rechargeAmount;
    if (!finalAmount || isNaN(finalAmount) || finalAmount < 1) {
      toast.error("Please enter a valid recharge amount (minimum ₹1).");
      return;
    }

    setRechargeLoading(true);

    const launched = await launchRazorpayRecharge({
      amount: finalAmount,
      userId,
      onSuccess: (paymentData) => {
        setRechargeLoading(false);
        const updatedBalance = localBalance + finalAmount;
        setLocalBalance(updatedBalance);

        const newTxn: WalletTransaction = {
          id: paymentData.paymentId,
          userId: userId || "current-user",
          transactionType: "CREDIT",
          category: "WALLET_RECHARGE",
          amount: finalAmount,
          balanceAfter: updatedBalance,
          referenceId: paymentData.orderId || paymentData.paymentId,
          description: `Razorpay Instant Wallet Recharge (${paymentMethod})`,
          createdAt: new Date().toISOString(),
        };
        setLocalTransactions((prev) => [newTxn, ...prev]);


        setRechargeOpen(false);
        setCustomAmount("");
        toast.success(`₹${finalAmount.toLocaleString("en-IN")} added to wallet successfully via Razorpay!`);
        router.refresh();
      },
      onError: (errMsg) => {
        setRechargeLoading(false);
        console.error("Razorpay recharge failed:", errMsg);
      },
      onClose: () => {
        setRechargeLoading(false);
      },
    });

    if (!launched) {
      setRechargeLoading(false);
    }
  }

  function handleExportStatement() {
    try {
      const headers = ["Transaction ID", "Date", "Category", "Type", "Amount", "Balance After", "AWB", "Reference", "Description"];
      const rows = filteredTransactions.map((t) => [
        t.id,
        new Date(t.createdAt).toLocaleString("en-IN"),
        t.category,
        t.transactionType,
        t.amount.toFixed(2),
        (t.balanceAfter ?? 0).toFixed(2),
        t.awbNumber || "N/A",
        t.referenceId || "N/A",
        `"${t.description.replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ShipWave_Wallet_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Wallet statement downloaded successfully!");
    } catch {
      toast.error("Failed to export statement.");
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="size-5 text-indigo-600" />
            Shipping Wallet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your available shipping balance, view pending COD remittances, and track freight deductions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRechargeOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> + Add Money
        </button>
      </div>

      {/* 2. TOP SUMMARY CARDS (3 Cards Desktop / Responsive Mobile Stacking) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Card 1: Available Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Available Balance</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Wallet Active
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatINR(localBalance)}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 font-medium">Available for creating shipments</p>

          <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRechargeOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              + Quick Recharge <ArrowRight size={12} />
            </button>
            <span className="text-[11px] text-slate-400">100% Usable</span>
          </div>
        </div>

        {/* Card 2: Pending COD */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Pending COD</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              <Clock size={11} /> Expected Cash
            </span>
          </div>

          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatINR(pendingCod)}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 font-medium">Expected from COD deliveries</p>

          <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800">
              Settlement Cycle: <strong>T+3 Days</strong>
            </span>
            <Link
              href="/cod"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View COD Settlements <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Card 3: Total Used */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/60 via-white to-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total Used</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              <Package size={11} /> Lifetime
            </span>
          </div>

          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatINR(totalUsed)}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 font-medium">Lifetime shipping charges spent</p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <ShieldCheck size={13} className="text-indigo-600" /> Logistics Invoices: Tax Compliant
            </span>
          </div>
        </div>
      </div>

      {/* 3. BALANCE ACTION BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Wallet size={20} />
          </span>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Wallet Balance
            </span>
            <span className="text-lg font-black text-slate-900">
              {formatINR(localBalance)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRechargeOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} /> + Add Money
          </button>
          <button
            type="button"
            onClick={handleExportStatement}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" /> View Statement
          </button>
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Header & Subtitle */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest wallet credits, freight deductions, refunds and adjustments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("ALL");
                setDateFilter("ALL");
                setStatusFilter("ALL");
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All Transactions &rarr;
            </button>
          </div>
        </div>

        {/* Compact Summary Bar */}
        <div className="px-5 py-2.5 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span>Showing <strong className="text-slate-900">{filteredTransactions.length}</strong> transactions</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-emerald-700 font-bold">Credits: +{formatINR(totalCredits)}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-rose-700 font-bold">Debits: −{formatINR(totalDebits)}</span>
            {totalRefunds > 0 && (
              <>
                <span className="text-slate-300">&bull;</span>
                <span className="text-amber-700 font-bold">Refunds: +{formatINR(totalRefunds)}</span>
              </>
            )}
          </div>
        </div>

        {/* 10. Filters Bar */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Order ID, AWB…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Type, Date, and Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="RECHARGE">Wallet Recharge</option>
              <option value="SHIPPING">Shipping Charge</option>
              <option value="COD">COD Settlement</option>
              <option value="REFUND">Refund</option>
              <option value="RTO">RTO Charge</option>
              <option value="NDR">NDR Charge</option>
              <option value="MANUAL">Manual Adjustment</option>
            </select>

            {/* Date Dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </div>
        </div>

        {/* 5. TRANSACTION LIST / CARDS */}
        <div className="divide-y divide-slate-100">
          {paginatedTransactions.length === 0 ? (
            /* 14. EMPTY STATE */
            <div className="py-16 text-center text-slate-400">
              <Package className="mx-auto size-12 text-slate-300 mb-3 stroke-1" />
              <h4 className="text-sm font-bold text-slate-800">No wallet transactions yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Your wallet recharge, shipping charges and refunds will appear here.
              </p>
              <button
                type="button"
                onClick={() => setRechargeOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
              >
                <Plus size={14} /> + Add Money
              </button>
            </div>
          ) : (
            paginatedTransactions.map((t) => {
              const isCredit = t.transactionType === "CREDIT";
              const isRefund = t.category === "CANCELLATION_REFUND" || t.category === "REFUND";
              const isShipping = t.category === "SHIPPING_CHARGE" || t.category === "SHIPPING_DEDUCTION";
              const isCod = t.category === "COD_SETTLEMENT" || t.category === "COD_REMITTANCE";

              return (
                <div
                  key={t.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  {/* Left & Center */}
                  <div className="flex items-start gap-3.5">
                    {/* Left Icon */}
                    <span
                      className={`grid size-10 place-items-center rounded-xl shrink-0 mt-0.5 ${
                        isCredit
                          ? "bg-emerald-100 text-emerald-800"
                          : isRefund
                          ? "bg-amber-100 text-amber-800"
                          : isCod
                          ? "bg-blue-100 text-blue-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft size={18} />
                      ) : isRefund ? (
                        <RotateCcw size={18} />
                      ) : isCod ? (
                        <Banknote size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </span>

                    {/* Center Title & Description */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          {t.category.replace(/_/g, " ")}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">{t.id}</span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium mt-0.5">{t.description}</p>

                      {/* Clickable AWB link */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {t.awbNumber ? (
                          <Link
                            href={`/shipments?q=${t.awbNumber}`}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md"
                          >
                            AWB: {t.awbNumber}
                            <ExternalLink size={10} />
                          </Link>
                        ) : null}

                        <span className="text-[11px] text-slate-400">
                          {new Date(t.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount, Historical Balance After, and View Breakup */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                    <span
                      className={`text-base font-black ${
                        isCredit ? "text-emerald-700" : "text-slate-900"
                      }`}
                    >
                      {isCredit ? "+" : "−"} {formatINR(t.amount)}
                    </span>

                    {/* Historical Balance Immediately After That Transaction */}
                    <span className="text-[11px] text-slate-500 font-medium sm:mt-0.5">
                      Balance After:{" "}
                      <strong className="text-slate-800 font-semibold font-mono">
                        {formatINR(t.balanceAfter ?? 0)}
                      </strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedTxn(t)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline sm:mt-1 cursor-pointer"
                    >
                      View Breakup &rarr;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 12. PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`size-7 rounded-lg font-bold text-xs cursor-pointer ${
                    currentPage === page
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 7. TRANSACTION BREAKUP MODAL / DRAWER */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Transaction Details</h3>
                <p className="text-[11px] text-slate-400 font-mono">{selectedTxn.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contextual Modal Content */}
            <div className="my-4 space-y-3 text-xs">
              {/* Common Info */}
              <div className="flex justify-between text-slate-600">
                <span>Transaction Type:</span>
                <span className="font-bold text-slate-900 uppercase">{selectedTxn.category.replace(/_/g, " ")}</span>
              </div>

              {selectedTxn.awbNumber && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>AWB Number:</span>
                  <Link
                    href={`/shipments?q=${selectedTxn.awbNumber}`}
                    className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {selectedTxn.awbNumber} <ExternalLink size={11} />
                  </Link>
                </div>
              )}

              {selectedTxn.orderNumber && (
                <div className="flex justify-between text-slate-600">
                  <span>Order ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedTxn.orderNumber}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Date &amp; Time:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedTxn.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>

              {/* Case A: Shipping Charge Breakdown */}
              {(selectedTxn.category === "SHIPPING_CHARGE" || selectedTxn.category === "SHIPPING_DEDUCTION") && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 mt-3">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                    Charge Breakdown
                  </span>
                  <div className="flex justify-between text-slate-600">
                    <span>Base Freight:</span>
                    <span className="font-medium text-slate-800">{formatINR(Math.round((selectedTxn.amount / 1.18) * 100) / 100)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Additional Weight:</span>
                    <span className="font-medium text-slate-800">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>COD Fee:</span>
                    <span className="font-medium text-slate-800">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Fuel/Surcharge:</span>
                    <span className="font-medium text-slate-800">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Other Charges:</span>
                    <span className="font-medium text-slate-800">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Applicable):</span>
                    <span className="font-medium text-slate-800">{formatINR(Math.round((selectedTxn.amount - selectedTxn.amount / 1.18) * 100) / 100)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Total Freight Deducted:</span>
                    <span className="text-rose-700 font-extrabold">− {formatINR(selectedTxn.amount)}</span>
                  </div>
                </div>
              )}

              {/* Case B: Wallet Recharge Breakdown */}
              {selectedTxn.category === "WALLET_RECHARGE" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2 mt-3">
                  <span className="text-[11px] font-bold text-emerald-900 block uppercase tracking-wider">
                    Topup Summary
                  </span>
                  <div className="flex justify-between text-slate-600">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-slate-800">UPI / Net Banking</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Gateway Reference:</span>
                    <span className="font-mono text-slate-800">{selectedTxn.referenceId || "PG_RZP_SUCCESS"}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable Tax:</span>
                    <span className="font-medium text-emerald-800">₹0.00 (Zero Fee)</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-slate-900">
                    <span>Amount Credited:</span>
                    <span className="text-emerald-700 font-black">+ {formatINR(selectedTxn.amount)}</span>
                  </div>
                </div>
              )}

              {/* Case C: Cancellation Refund Breakdown */}
              {(selectedTxn.category === "CANCELLATION_REFUND" || selectedTxn.category === "REFUND") && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2 mt-3">
                  <span className="text-[11px] font-bold text-amber-900 block uppercase tracking-wider">
                    Refund Breakdown (5-Hour Policy)
                  </span>
                  <div className="flex justify-between text-slate-600">
                    <span>Policy Status:</span>
                    <span className="font-semibold text-emerald-700">100% Full Refund</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cancellation Charge:</span>
                    <span className="font-medium text-slate-800">₹0.00</span>
                  </div>
                  <div className="pt-2 border-t border-amber-200 flex justify-between font-bold text-slate-900">
                    <span>Refund Credited:</span>
                    <span className="text-emerald-700 font-black">+ {formatINR(selectedTxn.amount)}</span>
                  </div>
                </div>
              )}

              {/* Historical Balance Sequence Box */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Previous Balance:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatINR(
                      selectedTxn.transactionType === "CREDIT"
                        ? (selectedTxn.balanceAfter ?? 0) - selectedTxn.amount
                        : (selectedTxn.balanceAfter ?? 0) + selectedTxn.amount,
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Balance After Transaction:</span>
                  <span className="font-mono font-black text-indigo-700">
                    {formatINR(selectedTxn.balanceAfter ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-700 font-bold pt-1">
                  <span>Transaction Status:</span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 size={12} /> Completed / Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedTxn.awbNumber ? (
                <Link
                  href={`/shipments?q=${selectedTxn.awbNumber}`}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Truck size={14} /> Track Shipment ({selectedTxn.awbNumber})
                </Link>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADD MONEY TO WALLET MODAL */}
      {rechargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Wallet size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Money to Wallet</h3>
                  <p className="text-[11px] text-slate-400">Instant shipping credits via UPI / Cards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRechargeOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-5 space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Select Amount</label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setRechargeAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                        rechargeAmount === amt && !customAmount
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {formatINR(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Or Enter Custom Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min={1}
                    placeholder="Enter amount (min ₹1)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />

                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 text-xs font-semibold cursor-pointer ${
                      paymentMethod === "UPI"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <QrCode size={14} /> UPI Apps
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("NET_BANKING")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 text-xs font-semibold cursor-pointer ${
                      paymentMethod === "NET_BANKING"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <Building2 size={14} /> Net Banking
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 text-xs font-semibold cursor-pointer ${
                      paymentMethod === "CARD"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <CreditCard size={14} /> Debit/Credit
                  </button>
                </div>
              </div>

              {/* Recharge Summary & Security Badge */}
              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 text-slate-600 border border-slate-100">
                <div className="flex justify-between">
                  <span>Recharge Amount:</span>
                  <span className="font-bold text-slate-900">
                    {formatINR(customAmount ? Number(customAmount) || 0 : rechargeAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee / GST:</span>
                  <span className="font-semibold text-emerald-700">₹0.00 (Zero Surcharge)</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Estimated New Balance:</span>
                  <span className="text-emerald-700 font-extrabold">
                    {formatINR(
                      localBalance + (customAmount ? Number(customAmount) || 0 : rechargeAmount),
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50/60 py-1.5 px-2 text-[11px] font-medium text-indigo-700">
                <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
                <span>Secured 256-bit Payment via <strong>Razorpay Payment Gateway</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRechargeOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rechargeLoading}
                onClick={handleRecharge}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                {rechargeLoading ? (
                  <>
                    <Loader2 className="animate-spin size-3.5" />
                    Opening Razorpay…
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Proceed with Razorpay ({formatINR(customAmount ? Number(customAmount) || 0 : rechargeAmount)})
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

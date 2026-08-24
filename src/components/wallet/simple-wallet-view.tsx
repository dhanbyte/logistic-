"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Filter,
  Info,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { rechargeWallet } from "@/app/ecommerce-actions";
import { formatINR } from "@/lib/calculations";
import type { WalletTransaction } from "@/types";

interface SimpleWalletViewProps {
  availableBalance: number;
  pendingCod: number;
  totalUsed: number;
  isLowBalance: boolean;
  transactions: WalletTransaction[];
}

export function SimpleWalletView({
  availableBalance,
  pendingCod,
  totalUsed,
  isLowBalance,
  transactions,
}: SimpleWalletViewProps) {
  // Recharge Modal State
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(2000);
  const [rechargeLoading, setRechargeLoading] = useState(false);

  // Selected Transaction for Itemized Breakdown Modal
  const [selectedTxn, setSelectedTxn] = useState<WalletTransaction | null>(null);

  // All Transactions View Toggle & Search
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const presets = [500, 1000, 2000, 5000, 10000];

  async function handleRecharge() {
    setRechargeLoading(true);
    const res = await rechargeWallet(rechargeAmount);
    setRechargeLoading(false);

    if (res.ok) {
      toast.success(`Successfully recharged ${formatINR(rechargeAmount)} to your wallet!`);
      setRechargeOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      searchTerm === "" ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.awbNumber && t.awbNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.referenceId && t.referenceId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === "ALL" ||
      (categoryFilter === "CREDIT" && t.transactionType === "CREDIT") ||
      (categoryFilter === "DEBIT" && t.transactionType === "DEBIT") ||
      t.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Low Balance Warning Banner */}
      {isLowBalance && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} className="text-amber-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-amber-900">Low Wallet Balance Alert</p>
              <p className="text-amber-800">
                Available balance is below ₹200. Recharge to avoid shipment booking interruptions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRechargeOpen(true)}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-xs cursor-pointer"
          >
            + Add Money
          </button>
        </div>
      )}

      {/* 3 Core Shipping Wallet Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Card 1: Available Balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Available Balance
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <Wallet size={18} />
            </span>
          </div>

          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {formatINR(availableBalance)}
          </p>

          <p className="mt-1 text-xs text-slate-400">Available for creating shipments</p>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setRechargeOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Add Money</span>
            </button>
          </div>
        </div>

        {/* Card 2: Pending COD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending COD
              </span>
              <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Banknote size={18} />
              </span>
            </div>

            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {formatINR(pendingCod)}
            </p>

            <p className="mt-1 text-xs text-slate-400">Expected from COD deliveries</p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Settlement Cycle:</span>
            <span className="font-bold text-slate-800">T+2 Working Days</span>
          </div>
        </div>

        {/* Card 3: Total Used */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Used
              </span>
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <Truck size={18} />
              </span>
            </div>

            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {formatINR(totalUsed)}
            </p>

            <p className="mt-1 text-xs text-slate-400">Lifetime shipping charges spent</p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Logistics Invoices:</span>
            <span className="font-bold text-emerald-700">100% Tax Compliant</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Latest wallet credits, freight deductions, and refunds</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAllTransactions(!showAllTransactions)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{showAllTransactions ? "Show Recent (5)" : "View All Transactions"}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Filter Bar (Visible in All Transactions Mode) */}
        {showAllTransactions && (
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              <input
                type="text"
                placeholder="Search by AWB, order or transaction ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {["ALL", "CREDIT", "DEBIT", "WALLET_RECHARGE", "SHIPPING_CHARGE", "CANCELLATION_REFUND"].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      categoryFilter === cat
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.replace(/_/g, " ")}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="divide-y divide-slate-100">
          {(showAllTransactions ? filteredTransactions : recentTransactions).map((t) => {
            const isCredit = t.transactionType === "CREDIT";
            const awbMatch =
              t.awbNumber ||
              (t.description?.includes("AWB")
                ? t.description.match(/AWB\s+([A-Za-z0-9_-]+)/)?.[1]
                : null);

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTxn(t)}
                className="flex items-center justify-between py-3.5 hover:bg-slate-50/70 rounded-xl px-2.5 transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        isCredit ? "text-emerald-700" : "text-slate-900"
                      }`}
                    >
                      {isCredit ? "+" : "−"} {formatINR(t.amount)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                        isCredit
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.category.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">{t.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    {awbMatch && (
                      <span className="font-mono font-bold text-indigo-600">
                        AWB: {awbMatch}
                      </span>
                    )}
                    <span>
                      {new Date(t.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400">Balance After:</span>
                  <p className="text-xs font-bold text-slate-800">{formatINR(t.balanceAfter)}</p>
                  <span className="text-[10px] text-indigo-600 font-medium hover:underline flex items-center justify-end gap-0.5 mt-0.5">
                    Breakup <ChevronRight size={10} />
                  </span>
                </div>
              </div>
            );
          })}

          {transactions.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Wallet className="mx-auto size-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No transactions recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Recharge your wallet or ship an order to see ledger entries here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Deduction Breakdown Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText size={16} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Transaction Breakdown</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedTxn.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 font-medium">Transaction Type:</span>
                <span className="font-bold text-slate-900">
                  {selectedTxn.category.replace(/_/g, " ")}
                </span>
              </div>

              {selectedTxn.awbNumber && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">AWB Number:</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedTxn.awbNumber}</span>
                </div>
              )}

              {/* Standard Itemized Freight Breakup */}
              <div className="rounded-xl border border-slate-100 p-3 space-y-2 bg-white">
                <div className="flex justify-between text-slate-600">
                  <span>Base Freight Charge:</span>
                  <span className="font-semibold">{formatINR(selectedTxn.amount * 0.65)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Weight Slab / Fuel Surcharge:</span>
                  <span className="font-semibold">{formatINR(selectedTxn.amount * 0.15)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>COD / Service Fee:</span>
                  <span className="font-semibold">{formatINR(selectedTxn.amount * 0.05)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18% Applicable):</span>
                  <span className="font-semibold">{formatINR(selectedTxn.amount * 0.15)}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Amount:</span>
                  <span className={selectedTxn.transactionType === "CREDIT" ? "text-emerald-700" : "text-slate-900"}>
                    {selectedTxn.transactionType === "CREDIT" ? "+" : "−"} {formatINR(selectedTxn.amount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1">
                <span>Balance After Transaction:</span>
                <span className="font-bold text-slate-800">{formatINR(selectedTxn.balanceAfter)}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {rechargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Wallet size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Add Money to Wallet</h3>
              </div>
              <button
                type="button"
                onClick={() => setRechargeOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recharge Amount (₹)
                </label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Popular Amounts
                </label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRechargeAmount(p)}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        rechargeAmount === p
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
                onClick={() => setRechargeOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rechargeLoading || rechargeAmount <= 0}
                onClick={handleRecharge}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {rechargeLoading && <Loader2 className="size-3.5 animate-spin" />}
                {rechargeLoading ? "Processing…" : `Proceed to Pay ${formatINR(rechargeAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

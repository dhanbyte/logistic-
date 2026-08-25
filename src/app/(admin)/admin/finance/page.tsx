import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Receipt,
  Scale,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getAdminDashboardKpis } from "@/lib/data/admin/dashboard";

export default async function AdminFinanceOverviewPage() {
  const kpis = await getAdminDashboardKpis();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Finance &amp; Treasury Overview</h1>
          <p className="text-xs text-slate-500">
            Real-time cashflow, carrier settlements, wallet reserves and platform margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/finance/wallet"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
          >
            Adjust Wallet
          </Link>
          <Link
            href="/admin/finance/cod-settlements"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
          >
            Review Settlements ({kpis.pendingOrders})
          </Link>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total COD Volume</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatINR(kpis.totalCodCollection)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{kpis.codOrders} COD Shipments</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Shipping Revenue Billed</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">{formatINR(kpis.totalShippingRevenue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Paid via Shipper Wallets</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs">
          <span className="text-xs font-bold text-emerald-900">Platform Realized Profit</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatINR(kpis.platformRevenue)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Net spread after carrier cost</p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5 shadow-xs">
          <span className="text-xs font-bold text-teal-900">Shipper Wallet Escrow</span>
          <p className="text-2xl font-black text-teal-800 mt-1">{formatINR(kpis.totalWalletBalance)}</p>
          <p className="text-[11px] text-teal-600 mt-0.5">Liquid balance across {kpis.totalUsers} sellers</p>
        </div>
      </div>


      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-3 text-xs">
        <Link
          href="/admin/finance/cod-settlements"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-500 transition-all shadow-xs block"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
            <Banknote size={18} className="text-amber-600" />
            <span>COD Settlements &rarr;</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Inspect courier cash remitted, deductions, and credit to shipper accounts.
          </p>
        </Link>

        <Link
          href="/admin/finance/ledger"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-500 transition-all shadow-xs block"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
            <Receipt size={18} className="text-indigo-600" />
            <span>Immutable Ledger &rarr;</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Audit-proof double-entry transaction record for every single rupee moved.
          </p>
        </Link>

        <Link
          href="/admin/finance/reconciliation"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-500 transition-all shadow-xs block"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
            <Scale size={18} className="text-teal-600" />
            <span>Reconciliation Engine &rarr;</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Detect weight discrepancy overcharges and courier billing mismatches.
          </p>
        </Link>
      </div>
    </div>
  );
}

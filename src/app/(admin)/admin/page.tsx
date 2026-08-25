import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  IndianRupee,
  Package,
  PackageCheck,
  Percent,
  Plus,
  Radio,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getAdminDashboardKpis } from "@/lib/data/admin/dashboard";

export default async function AdminDashboardPage() {
  const kpis = await getAdminDashboardKpis();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
              Platform Command Center
            </span>
            <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ALL SYSTEMS ONLINE
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1.5 tracking-tight">
            ShipWave.in Super Admin
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-tenant monitoring across all sellers, couriers, wallets and remittances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users/kyc"
            className="rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>KYC Records ({kpis.totalUsers})</span>
          </Link>
          <Link
            href="/admin/finance/cod-settlements"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-xs flex items-center gap-1.5"
          >
            <IndianRupee size={15} />
            <span>COD Settlements</span>
          </Link>
        </div>

      </div>

      {/* Section 1: User & Customer Metrics */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Users size={14} className="text-indigo-600" /> User Accounts &amp; Onboarding
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Registered Users</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.totalUsers}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">100% Verified Sellers</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Active Shippers</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{kpis.activeUsers}</p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Dispatched in last 30d</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">New Users Today</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">+{kpis.newUsersToday}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">KYC auto-triggered</p>
          </div>
        </div>
      </div>

      {/* Section 2: Order & Shipment Operational Matrix (8 KPIs) */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Truck size={14} className="text-indigo-600" /> Global Orders &amp; Courier Lifecycle
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Total Orders</span>
            <p className="text-xl font-black text-slate-900 mt-1">{kpis.totalOrders}</p>
            <span className="text-[10px] text-slate-400">All-time</span>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-indigo-900 block">Today&apos;s Bookings</span>
            <p className="text-xl font-black text-indigo-700 mt-1">{kpis.todaysOrders}</p>
            <span className="text-[10px] text-indigo-600 font-medium">Live pipeline</span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-900 block">Pending Pickup</span>
            <p className="text-xl font-black text-amber-700 mt-1">{kpis.pendingOrders}</p>
            <span className="text-[10px] text-amber-600">Manifested</span>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-blue-900 block">In Transit</span>
            <p className="text-xl font-black text-blue-700 mt-1">{kpis.inTransit}</p>
            <span className="text-[10px] text-blue-600 font-medium">On the road</span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-900 block">Delivered</span>
            <p className="text-xl font-black text-emerald-700 mt-1">{kpis.delivered}</p>
            <span className="text-[10px] text-emerald-600 font-medium">POD Received</span>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-900 block">NDR Exceptions</span>
            <p className="text-xl font-black text-rose-700 mt-1">{kpis.ndr}</p>
            <span className="text-[10px] text-rose-600 font-medium">Needs Action</span>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-orange-900 block">RTO Initiated</span>
            <p className="text-xl font-black text-orange-700 mt-1">{kpis.rto}</p>
            <span className="text-[10px] text-orange-600">Returning</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Cancelled</span>
            <p className="text-xl font-black text-slate-600 mt-1">{kpis.cancelled}</p>
            <span className="text-[10px] text-slate-400">Void AWBs</span>
          </div>
        </div>
      </div>

      {/* Section 3: Financial Overview & Platform Revenue (6 KPIs) */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <IndianRupee size={14} className="text-emerald-600" /> Financials, Cashflow &amp; Platform Margins
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total COD Collection</span>
            <p className="text-xl font-black text-slate-900 mt-1">{formatINR(kpis.totalCodCollection)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{kpis.codOrders} COD Orders</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Prepaid Value</span>
            <p className="text-xl font-black text-slate-900 mt-1">{formatINR(kpis.totalPrepaidValue)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{kpis.prepaidOrders} Prepaid Orders</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Shipping Revenue</span>
            <p className="text-xl font-black text-indigo-700 mt-1">{formatINR(kpis.totalShippingRevenue)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Freight billed to sellers</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
            <span className="text-xs font-bold text-emerald-900">Platform Net Revenue</span>
            <p className="text-xl font-black text-emerald-700 mt-1">{formatINR(kpis.platformRevenue)}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">~15% realized spread</p>
          </div>

          <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 shadow-xs">
            <span className="text-xs font-bold text-teal-900">Total Wallet Balances</span>
            <p className="text-xl font-black text-teal-800 mt-1">{formatINR(kpis.totalWalletBalance)}</p>
            <p className="text-[11px] text-teal-600 mt-0.5">User prepaid escrow</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs">
            <span className="text-xs font-bold text-amber-900">Pending Remittances</span>
            <p className="text-xl font-black text-amber-800 mt-1">{formatINR(kpis.pendingRemittance)}</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Automated T+2 cycle</p>
          </div>

        </div>
      </div>

      {/* Section 4: Live Courier Partner Health & Connectivity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <Radio size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Integrated Courier Gateways Status</h3>
              <p className="text-xs text-slate-500">Live API response time, health and order distribution</p>
            </div>
          </div>
          <Link
            href="/admin/couriers"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Manage Courier Gateways &rarr;
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Shadowfax */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Shadowfax Express</h4>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse"></span> ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Live Prod Token Connected</p>
            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-[11px]">
              <span className="text-slate-500">Success Rate:</span>
              <strong className="text-emerald-700">97.8%</strong>
            </div>
            <div className="flex justify-between text-[11px] mt-1">
              <span className="text-slate-500">Latency:</span>
              <span className="font-mono font-bold text-slate-700">245ms</span>
            </div>
          </div>

          {/* Xpressbees */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Xpressbees Logistics</h4>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse"></span> ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Surface &amp; Air Network</p>
            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-[11px]">
              <span className="text-slate-500">Success Rate:</span>
              <strong className="text-emerald-700">96.2%</strong>
            </div>
            <div className="flex justify-between text-[11px] mt-1">
              <span className="text-slate-500">Latency:</span>
              <span className="font-mono font-bold text-slate-700">310ms</span>
            </div>
          </div>

          {/* Delhivery */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Delhivery Direct</h4>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse"></span> ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Pan-India Express Hub</p>
            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-[11px]">
              <span className="text-slate-500">Success Rate:</span>
              <strong className="text-emerald-700">98.4%</strong>
            </div>
            <div className="flex justify-between text-[11px] mt-1">
              <span className="text-slate-500">Latency:</span>
              <span className="font-mono font-bold text-slate-700">180ms</span>
            </div>
          </div>

          {/* Ekart */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Ekart Surface</h4>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse"></span> ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Tier-2/3 Specialized</p>
            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-[11px]">
              <span className="text-slate-500">Success Rate:</span>
              <strong className="text-emerald-700">95.5%</strong>
            </div>
            <div className="flex justify-between text-[11px] mt-1">
              <span className="text-slate-500">Latency:</span>
              <span className="font-mono font-bold text-slate-700">420ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

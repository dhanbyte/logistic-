import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  Gift,
  IndianRupee,
  Lock,
  Package,
  Plus,
  RotateCcw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getAdminUsersList } from "@/lib/data/admin/users";
import { AddUserModal } from "@/components/admin/add-user-modal";

export default async function AdminUsersPage() {
  const users = await getAdminUsersList();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Merchant &amp; Shipper Management 360</h1>
          <p className="text-xs text-slate-500">
            Onboard new merchants, configure custom courier pricing, set Advance vs COD deduction rules, and track delivery performance ratios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AddUserModal />
          <Link
            href="/admin/users/wallets"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
          >
            <Wallet size={15} className="text-indigo-600" />
            <span>Escrow Reserves</span>
          </Link>
        </div>
      </div>

      {/* Users Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Registered Merchants</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{users.length}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">100% Active Shippers</span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold text-emerald-900">Avg Delivery Success Ratio</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">96.4%</p>
          <span className="text-[11px] text-emerald-600 font-medium">Pan-India Courier Network</span>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold text-indigo-900">Total Shipper Wallet Escrow</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">
            {formatINR(users.reduce((acc, u) => acc + u.walletBalance, 0))}
          </p>
          <span className="text-[11px] text-indigo-600 font-medium">Prepaid funds across {users.length} merchants</span>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold text-teal-900">COD Settlement Mode</span>
          <p className="text-2xl font-black text-teal-800 mt-1">T + 2 Days</p>
          <span className="text-[11px] text-teal-600 font-medium">Auto-deduction active</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by merchant name, email, brand, phone…"
              className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">{users.length} Total Merchants</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Merchant &amp; Brand</th>
                <th className="py-3 px-4">Billing Model</th>
                <th className="py-3 px-4">Delivery SLA</th>
                <th className="py-3 px-4">Wallet &amp; Credit</th>
                <th className="py-3 px-4">Orders &amp; Volume</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {users.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
                    >
                      <span>{u.name}</span>
                      <ExternalLink size={11} className="text-slate-400" />
                    </Link>
                    <p className="text-[11px] text-slate-500">{u.companyName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{u.email} &bull; {u.phone}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-block rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                      {idx % 2 === 0 ? "Prepaid (Advance)" : "Postpaid (COD Deduct)"}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {idx % 2 === 0 ? "Wallet Auto-Debit" : "Auto-cut from COD"}
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500"></span>
                      <strong className="text-emerald-700 text-xs">96.4% Delivered</strong>
                    </div>
                    <span className="text-[10px] text-slate-400">1.4% RTO Ratio</span>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-black text-sm text-slate-900">{formatINR(u.walletBalance)}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">+₹500 Free Credit</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{u.totalOrders} Orders</p>
                    <p className="text-[11px] text-slate-400">{formatINR(u.totalSpent)} billed</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                      {u.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1 shadow-xs"
                        title="User 360 View"
                      >
                        <Eye size={12} />
                        <span>360 View</span>
                      </Link>

                      <Link
                        href={`/admin/users/${u.id}/rates`}
                        className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 inline-flex items-center gap-1 shadow-xs"
                        title="Set Custom Courier Rates"
                      >
                        <Scale size={12} />
                        <span>Assign Rates</span>
                      </Link>

                      <Link
                        href={`/admin/finance/wallet?userId=${u.id}`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        title="Adjust Wallet"
                      >
                        <Wallet size={13} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

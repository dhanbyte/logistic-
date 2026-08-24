import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  IndianRupee,
  Lock,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getAdminUsersList } from "@/lib/data/admin/users";

export default async function AdminUsersPage() {
  const users = await getAdminUsersList();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User &amp; Seller Management</h1>
          <p className="text-xs text-slate-500">
            Inspect all registered shippers, KYC compliance, wallet balances and order volumes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users/kyc"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>KYC Verification Queue</span>
          </Link>
          <Link
            href="/admin/finance/wallet"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
          >
            <Wallet size={15} />
            <span>Adjust User Wallet</span>
          </Link>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name, email, company, phone…"
              className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">{users.length} Total Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">User &amp; Contact</th>
                <th className="py-3 px-4">Business / Company</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4">Orders &amp; Spent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                    <p className="text-[11px] text-slate-400">{u.phone}</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{u.companyName}</p>
                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-medium">
                      GST: {u.gstStatus}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        u.kycStatus === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : u.kycStatus === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {u.kycStatus}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-black text-sm text-slate-900">{formatINR(u.walletBalance)}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Available for shipping</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{u.totalOrders} Orders</p>
                    <p className="text-[11px] text-slate-400">{formatINR(u.totalSpent)} lifetime</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                      {u.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/users/${u.id}/rates`}
                        className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 shadow-xs"
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
                      <Link
                        href={`/admin/users/kyc`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        title="Review KYC"
                      >
                        <ShieldCheck size={13} />
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

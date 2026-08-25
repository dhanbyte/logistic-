import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, IndianRupee, Search, ShieldCheck, Wallet } from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getAdminUsersList } from "@/lib/data/admin/users";

export default async function AdminUserWalletsPage() {
  const users = await getAdminUsersList();
  const totalBalance = users.reduce((acc, u) => acc + u.walletBalance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Wallets &amp; Escrow Balances</h1>
          <p className="text-xs text-slate-500">
            Real-time balance monitor across all shipper accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/finance/wallet"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
          >
            <Wallet size={15} />
            <span>Manual Adjustment</span>
          </Link>
        </div>
      </div>

      {/* Escrow Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 shadow-xs">
          <span className="text-xs font-bold text-teal-900">Total User Escrow Balance</span>
          <p className="text-2xl font-black text-teal-800 mt-1">{formatINR(totalBalance)}</p>
          <p className="text-[11px] text-teal-600 mt-0.5">Across {users.length} registered shippers</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Auto-Debit Threshold</span>
          <p className="text-2xl font-black text-slate-900 mt-1">₹500</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Instant label generation active</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Active Seller Accounts</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{users.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">100% KYC Verified</p>
        </div>
      </div>


      {/* Wallets Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">Business / Company</th>
              <th className="py-3 px-4">Available Balance</th>
              <th className="py-3 px-4">Lifetime Spent</th>
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
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{u.companyName}</td>
                <td className="py-3 px-4">
                  <span className="text-sm font-black text-emerald-700">{formatINR(u.walletBalance)}</span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-700">{formatINR(u.totalSpent)}</td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    ACTIVE
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/finance/wallet?userId=${u.id}`}
                    className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
                  >
                    Adjust
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

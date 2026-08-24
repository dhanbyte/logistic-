import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Lock,
  Receipt,
  Search,
  ShieldCheck,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getAdminWalletLedger } from "@/lib/data/admin/finance";

export default async function AdminLedgerPage() {
  const ledger = await getAdminWalletLedger();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Immutable Double-Entry Financial Ledger</h1>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 flex items-center gap-1">
              <ShieldCheck size={12} /> Audit-Proof
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete, non-editable audit trail of every credit, debit, settlement and remittance across ShipWave.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/finance/wallet"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
          >
            New Adjustment
          </Link>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Ref, User or Category…"
              className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">{ledger.length} Ledger Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Transaction ID &amp; Time</th>
                <th className="py-3 px-4">Shipper / User</th>
                <th className="py-3 px-4">Category &amp; Type</th>
                <th className="py-3 px-4">Reference / AWB</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Prev Balance</th>
                <th className="py-3 px-4 text-right">New Balance</th>
                <th className="py-3 px-4 text-right">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {ledger.map((item) => {
                const isCredit = item.creditDebit === "CREDIT";
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-900">{item.id}</p>
                      <p className="text-[11px] text-slate-400">{item.createdAt}</p>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.userName}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          isCredit
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.type.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {item.referenceId || "N/A"}
                    </td>

                    <td className="py-3 px-4 text-right font-black">
                      <span
                        className={`flex items-center justify-end gap-0.5 ${
                          isCredit ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isCredit ? "+" : "−"} {formatINR(item.amount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-500">
                      {formatINR(item.previousBalance)}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatINR(item.newBalance)}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                      {item.createdBy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

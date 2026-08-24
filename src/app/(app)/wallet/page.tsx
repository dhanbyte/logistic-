import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Clock,
  CreditCard,
  Download,
  Gift,
  IndianRupee,
  Lock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatINR } from "@/lib/calculations";
import { getWalletSummary } from "@/lib/data/wallet";
import { WalletRechargeModal } from "@/components/wallet/wallet-recharge-modal";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const summary = await getWalletSummary(params.type);

  return (
    <>
      <PageHeader
        title="Prepaid Freight Wallet & Credit System"
        description="Recharge your shipping cash balance, utilize promotional credit, and track double-entry transaction ledgers."
      >
        <WalletRechargeModal />
      </PageHeader>

      {/* Low Balance Warning Banner */}
      {summary.isLowBalance && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs animate-in fade-in">
          <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900">Low Wallet Balance Alert</h4>
            <p className="mt-0.5 text-amber-800">
              Your available cash balance is below ₹200. Recharge now to prevent courier booking interruptions.
            </p>
          </div>
          <WalletRechargeModal />
        </div>
      )}

      {/* 5 Financial Asset Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Total Available Shipping Funds */}
        <div className="rounded-xl border border-indigo-300 bg-linear-to-br from-indigo-50 to-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                Total Available Shipping Funds
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Cash + Usable Credit</span>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Wallet size={18} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
            {formatINR(summary.totalAvailableFunds)}
          </p>
          <div className="mt-2 pt-2 border-t border-indigo-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-600">Liquid Cash: <strong>{formatINR(summary.cashBalance)}</strong></span>
            <span className="text-emerald-700 font-semibold">Credit: <strong>{formatINR(summary.freeCredit)}</strong></span>
          </div>
        </div>

        {/* Card 2: Free Shipping Credit */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Free Credit
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white">
              <Gift size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700 tracking-tight">
            {formatINR(summary.freeCredit)}
          </p>
          <span className="mt-1 inline-block text-[10px] text-emerald-800 font-semibold bg-emerald-100/80 px-1.5 py-0.2 rounded">
            Non-withdrawable
          </span>
        </div>

        {/* Card 3: Reserved In-Transit */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Reserved Funds
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-amber-600 text-white">
              <Lock size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700 tracking-tight">
            {formatINR(summary.reservedBalance)}
          </p>
          <p className="mt-1 text-[10px] text-amber-800">Locked for labels</p>
        </div>

        {/* Card 4: Pending COD Receivables */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Pending COD
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-teal-600 text-white">
              <Banknote size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-teal-800 tracking-tight">
            {formatINR(summary.codPending)}
          </p>
          <p className="mt-1 text-[10px] text-teal-700">T+2 payout cycle</p>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Wallet Transactions &amp; Audit Ledger</h3>
            <p className="text-xs text-slate-500">Immutable double-entry audit record for every rupee movement</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/wallet"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                !params.type || params.type === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              All Entries
            </Link>
            <Link
              href="/wallet?type=CREDIT"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                params.type === "CREDIT"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Credits (+)
            </Link>
            <Link
              href="/wallet?type=DEBIT"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                params.type === "DEBIT"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Debits (−)
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Transaction ID &amp; Time</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description &amp; Reference</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {summary.transactions.map((t) => {
                  const isCredit = t.transactionType === "CREDIT";
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-900">{t.id}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(t.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                            isCredit
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {t.category.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{t.description}</p>
                        {t.referenceId && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            Ref: {t.referenceId}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-black text-sm flex items-center justify-end gap-0.5 ${
                            isCredit ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {isCredit ? "+" : "−"} {formatINR(t.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatINR(t.balanceAfter)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

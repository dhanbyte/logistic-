import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Clock,
  CreditCard,
  Download,
  IndianRupee,
  Plus,
  ShieldCheck,
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
        title="Prepaid Freight Wallet & Remittance"
        description="Monitor your prepaid shipping balance, auto-debits on label creation, and COD remittances."
      >
        <WalletRechargeModal />
      </PageHeader>

      {/* Top 3 Financial Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50/70 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Prepaid Balance
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
              <Wallet size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(summary.currentBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-600" /> Auto-debit on label generation
          </p>
        </div>

        <div className="rounded-xl border border-teal-200 bg-linear-to-br from-teal-50/70 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              COD Pending Remittance
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-teal-600 text-white">
              <Banknote size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(summary.codPending)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Scheduled next payout cycle (T+2 Days)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Shipping Spend
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <IndianRupee size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(summary.totalShippingSpend)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Lifetime courier freight costs</p>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Wallet Transactions Ledger</h3>
            <p className="text-xs text-slate-500">Complete audit trail of all credits and deductions</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/wallet"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                !params.type || params.type === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              All
            </a>
            <a
              href="/wallet?type=CREDIT"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                params.type === "CREDIT"
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Credits
            </a>
            <a
              href="/wallet?type=DEBIT"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                params.type === "DEBIT"
                  ? "bg-rose-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Debits
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Transaction ID & Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description / Reference</th>
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
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
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
                          className={`font-extrabold text-sm flex items-center justify-end gap-0.5 ${
                            isCredit ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isCredit ? "+" : "-"} {formatINR(t.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
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

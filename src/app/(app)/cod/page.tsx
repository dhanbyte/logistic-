import { Banknote, CheckCircle2, Clock, Download, IndianRupee, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatINR } from "@/lib/calculations";
import { getMerchantCodSettlements } from "@/lib/finance/cod-service";

export default async function CodPage() {
  const settlements = await getMerchantCodSettlements("0b67cbd5-bf09-4c54-b4be-02d56af6f0a5");

  const totalCollected = settlements.reduce((acc, s) => acc + s.codAmountPaise, 0);
  const totalNetPaid = settlements
    .filter((s) => s.status === "PAID")
    .reduce((acc, s) => acc + s.netSettlementPaise, 0);

  return (
    <>
      <PageHeader
        title="COD Remittance & Bank Settlement Cycles"
        description="Track cash collected on deliveries across couriers, itemized freight deductions, and bank UTR numbers."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 shadow-xs">
          <span className="text-xs font-semibold text-teal-800">Pending COD in Field</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatINR(38450)}</p>
          <p className="text-[11px] text-teal-700 font-medium mt-0.5">Next settlement on Wednesday (T+2)</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800">Total COD Remitted to Bank</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatINR(totalNetPaid / 100)}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">100% on-time payouts</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Settlement Frequency</span>
          <p className="text-2xl font-black text-slate-900 mt-1">T + 2 Days</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Automated NEFT / IMPS to Bank</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Itemized Delivery Settlement Records</h3>
          <span className="text-xs font-semibold text-slate-500">Segregated COD Escrow Account</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Settlement ID &amp; Date</th>
                <th className="py-3 px-4">Courier &amp; AWB</th>
                <th className="py-3 px-4">COD Collected</th>
                <th className="py-3 px-4">Freight &amp; COD Fees</th>
                <th className="py-3 px-4 font-bold">Net Bank Payout</th>
                <th className="py-3 px-4">Beneficiary Bank</th>
                <th className="py-3 px-4">Status &amp; UTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-slate-900">{s.id}</p>
                    <p className="text-[11px] text-slate-400">{s.settlementDate}</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{s.courierName}</p>
                    <p className="font-mono text-[11px] text-indigo-600 font-bold">{s.awbNumber}</p>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">
                    {formatINR(s.codAmountPaise / 100)}
                  </td>

                  <td className="py-3 px-4 text-rose-600 font-medium">
                    −{formatINR((s.shippingChargePaise + s.codFeePaise + s.taxPaise) / 100)}
                  </td>

                  <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                    {formatINR(s.netSettlementPaise / 100)}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-mono text-slate-800">A/C: •••• {s.bankAccountLast4}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.bankIfsc}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        s.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800 animate-pulse"
                      }`}
                    >
                      {s.status}
                    </span>
                    {s.paymentReference && (
                      <p className="font-mono text-[10px] text-slate-500 font-semibold mt-0.5">
                        UTR: {s.paymentReference}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

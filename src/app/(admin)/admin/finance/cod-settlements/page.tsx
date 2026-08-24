import { Banknote, CheckCircle2, IndianRupee, Search } from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { getAdminCodSettlements } from "@/lib/data/admin/finance";

export default async function AdminCodSettlementsPage() {
  const settlements = await getAdminCodSettlements();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">COD (Cash on Delivery) Settlements</h1>
        <p className="text-xs text-slate-500">
          Remittance reconciliation across delivered orders, courier deductions, and merchant payouts.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Settlement ID &amp; Date</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">AWB &amp; Order</th>
              <th className="py-3 px-4">Courier Partner</th>
              <th className="py-3 px-4">COD Collected</th>
              <th className="py-3 px-4">Courier Freight &amp; Fees</th>
              <th className="py-3 px-4">Final Net Settled</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {settlements.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-slate-900">{s.id}</p>
                  <p className="text-[11px] text-slate-400">{s.settlementDate}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{s.userName}</td>
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-indigo-700">{s.awbNumber}</p>
                  <p className="text-[11px] text-slate-400">{s.orderNumber}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{s.courierName}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{formatINR(s.codAmount)}</td>
                <td className="py-3 px-4 text-rose-700 font-medium">
                  −{formatINR(s.courierCharges + s.codFee + s.platformFee)}
                </td>
                <td className="py-3 px-4 font-black text-emerald-700">
                  {formatINR(s.finalSettlementAmount)}
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      s.status === "SETTLED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

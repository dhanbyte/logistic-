import { Banknote, CheckCircle2, Clock, Download, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatINR } from "@/lib/calculations";

export default async function CodPage() {
  const settlements = [
    {
      id: "set-101",
      reference: "CRF-2026-AUG-18",
      totalCollected: 4899,
      courierDeductions: 149,
      netAmount: 4750,
      status: "REMITTED",
      remittedAt: "2026-08-18",
      utr: "HDFC2910291039",
    },
    {
      id: "set-102",
      reference: "CRF-2026-AUG-15",
      totalCollected: 8990,
      courierDeductions: 240,
      netAmount: 8750,
      status: "REMITTED",
      remittedAt: "2026-08-15",
      utr: "HDFC2819201991",
    },
  ];

  return (
    <>
      <PageHeader
        title="COD Remittance & Payout Cycles"
        description="Track cash collected on deliveries across couriers, remittance cycles, and bank UTR numbers."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
          <span className="text-xs font-semibold text-teal-800">Pending COD in Field</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(38450)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Next settlement on Wednesday</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500">Total COD Remitted</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(124890)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">All cycles on time</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500">Settlement Frequency</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">T + 2 Days</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Automated NEFT / IMPS to Bank</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Settlement Ref #</th>
              <th className="py-3 px-4">Total Collected</th>
              <th className="py-3 px-4">Courier Charges</th>
              <th className="py-3 px-4 font-bold">Net Payout</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Bank UTR</th>
              <th className="py-3 px-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {settlements.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.reference}</td>
                <td className="py-3 px-4">{formatINR(s.totalCollected)}</td>
                <td className="py-3 px-4 text-rose-600">-{formatINR(s.courierDeductions)}</td>
                <td className="py-3 px-4 font-extrabold text-emerald-700">{formatINR(s.netAmount)}</td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {s.status}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{s.utr}</td>
                <td className="py-3 px-4 text-right text-slate-500">{s.remittedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

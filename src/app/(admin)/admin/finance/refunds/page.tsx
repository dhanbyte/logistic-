import { CheckCircle2, RotateCcw, Search } from "lucide-react";
import { formatINR } from "@/lib/calculations";

export default function AdminRefundsPage() {
  const refunds = [
    {
      id: "ref-991",
      userId: "usr-1",
      userName: "Dhanbyte Logistics",
      type: "CANCELLED_LABEL_REFUND",
      awbNumber: "SF37164698496",
      refundAmount: 42.5,
      reason: "Shipper cancelled before courier pickup. Instant wallet credit.",
      processedAt: "2026-08-24 15:45",
      status: "COMPLETED",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Refunds &amp; Freight Reversals</h1>
        <p className="text-xs text-slate-500">
          Manage cancelled labels, voided courier AWBs and automated wallet credit reversals.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Refund ID &amp; Time</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">Type &amp; AWB</th>
              <th className="py-3 px-4">Refund Reason</th>
              <th className="py-3 px-4">Amount Recredited</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {refunds.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-slate-900">{r.id}</p>
                  <p className="text-[11px] text-slate-400">{r.processedAt}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{r.userName}</td>
                <td className="py-3 px-4">
                  <span className="rounded bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 text-[10px]">
                    {r.type.replace(/_/g, " ")}
                  </span>
                  <p className="font-mono font-bold text-indigo-700 mt-0.5">{r.awbNumber}</p>
                </td>
                <td className="py-3 px-4 font-medium text-slate-700">{r.reason}</td>
                <td className="py-3 px-4 font-black text-emerald-700">+{formatINR(r.refundAmount)}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                    {r.status}
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

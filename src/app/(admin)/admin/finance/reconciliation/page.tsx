import { AlertTriangle, CheckCircle2, IndianRupee, Scale, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/calculations";

export default function AdminReconciliationPage() {
  const disputes = [
    {
      id: "rec-01",
      awbNumber: "SF37164698496",
      seller: "Dhanbyte Logistics",
      courier: "Shadowfax Express",
      declaredWeight: "0.50 kg",
      courierAuditedWeight: "0.85 kg",
      excessWeight: "+0.35 kg",
      extraChargeClaimed: 25,
      status: "AUTO_ACCEPTED",
      date: "2026-08-24",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Discrepancy &amp; Weight Reconciliation Engine</h1>
        <p className="text-xs text-slate-500">
          Automated comparison of courier scanned weight vs merchant declared weight, slab upgrades, and auto-disputes.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">AWB &amp; Date</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">Courier Partner</th>
              <th className="py-3 px-4">Merchant Declared</th>
              <th className="py-3 px-4">Courier Audited</th>
              <th className="py-3 px-4">Discrepancy Charge</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {disputes.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-slate-900">{d.awbNumber}</p>
                  <p className="text-[11px] text-slate-400">{d.date}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{d.seller}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{d.courier}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-700">{d.declaredWeight}</td>
                <td className="py-3 px-4 font-mono font-bold text-rose-700">{d.courierAuditedWeight}</td>
                <td className="py-3 px-4 font-black text-rose-700">+{formatINR(d.extraChargeClaimed)}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                    {d.status.replace(/_/g, " ")}
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

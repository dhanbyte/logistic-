import { CheckCircle2, CreditCard, IndianRupee, Search } from "lucide-react";
import { formatINR } from "@/lib/calculations";

export default function AdminPrepaidSettlementsPage() {
  const prepaidSettlements = [
    {
      id: "set-pre-01",
      userId: "usr-1",
      userName: "Dhanbyte Logistics",
      orderNumber: "ORD-991823",
      awbNumber: "SF37164698496",
      prepaidAmount: 2499,
      shippingChargeDeducted: 42.5,
      netSettledToWallet: 2456.5,
      date: "2026-08-24",
      status: "SETTLED",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Prepaid Settlements &amp; Auto-Credits</h1>
        <p className="text-xs text-slate-500">
          Accounting for upfront merchant prepaid transactions and freight charge settlement.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Settlement ID &amp; Date</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">AWB &amp; Order</th>
              <th className="py-3 px-4">Customer Prepaid</th>
              <th className="py-3 px-4">Shipping Freight Deducted</th>
              <th className="py-3 px-4">Net Merchant Value</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {prepaidSettlements.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-slate-900">{s.id}</p>
                  <p className="text-[11px] text-slate-400">{s.date}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{s.userName}</td>
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-indigo-700">{s.awbNumber}</p>
                  <p className="text-[11px] text-slate-400">{s.orderNumber}</p>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">{formatINR(s.prepaidAmount)}</td>
                <td className="py-3 px-4 text-rose-700 font-medium">−{formatINR(s.shippingChargeDeducted)}</td>
                <td className="py-3 px-4 font-black text-emerald-700">{formatINR(s.netSettledToWallet)}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
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

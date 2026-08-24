import { CreditCard, ExternalLink, IndianRupee, Search } from "lucide-react";
import { formatINR } from "@/lib/calculations";

export default function AdminPaymentsPage() {
  const payments = [
    {
      id: "pay_rzp_9821920",
      user: "Dhananjay (Dhanbyte Logistics)",
      gateway: "Razorpay PG",
      method: "UPI (Google Pay)",
      amount: 10000,
      fee: 200,
      gst: 36,
      net: 9764,
      status: "CAPTURED",
      timestamp: "2026-08-24 14:30",
    },
    {
      id: "pay_rzp_9821919",
      user: "Pooja Sharma",
      gateway: "Razorpay PG",
      method: "HDFC Netbanking",
      amount: 5000,
      fee: 100,
      gst: 18,
      net: 4882,
      status: "CAPTURED",
      timestamp: "2026-08-23 18:00",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Payment Gateway Inbound Transactions</h1>
        <p className="text-xs text-slate-500">
          Monitor online UPI, card and net-banking wallet recharges via Razorpay / Cashfree.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Payment ID &amp; Time</th>
              <th className="py-3 px-4">Shipper / User</th>
              <th className="py-3 px-4">Gateway &amp; Method</th>
              <th className="py-3 px-4">Gross Amount</th>
              <th className="py-3 px-4">MDR &amp; GST</th>
              <th className="py-3 px-4">Net Settled</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-slate-900">{p.id}</p>
                  <p className="text-[11px] text-slate-400">{p.timestamp}</p>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{p.user}</td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-indigo-700">{p.gateway}</span>
                  <p className="text-[10px] text-slate-400">{p.method}</p>
                </td>
                <td className="py-3 px-4 font-black text-slate-900">{formatINR(p.amount)}</td>
                <td className="py-3 px-4 text-slate-500 font-medium">
                  {formatINR(p.fee + p.gst)}
                </td>
                <td className="py-3 px-4 font-bold text-emerald-700">{formatINR(p.net)}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                    {p.status}
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

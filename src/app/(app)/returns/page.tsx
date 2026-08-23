import { CheckCircle2, PackageCheck, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatINR } from "@/lib/calculations";

export default async function ReturnsPage() {
  const mockReturns = [
    {
      id: "ret-1",
      orderNumber: "SW-83912",
      customerName: "Pooja Hegde",
      returnReason: "Size too small (Requested exchange)",
      awb: "XB-REV-991823",
      courier: "Xpressbees Reverse",
      status: "PICKUP_SCHEDULED",
      refundAmount: 1899,
      date: "2026-08-22",
    },
  ];

  return (
    <>
      <PageHeader
        title="Customer Returns (Reverse Pickups)"
        description="Manage customer-initiated return requests, reverse pickup tracking, and QC checks."
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Return AWB</th>
              <th className="py-3 px-4">Order & Buyer</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Courier</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Refund Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {mockReturns.map((ret) => (
              <tr key={ret.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-bold text-indigo-600">{ret.awb}</td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-900">{ret.orderNumber}</p>
                  <p className="text-[11px] text-slate-400">{ret.customerName}</p>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">{ret.returnReason}</td>
                <td className="py-3 px-4">{ret.courier}</td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                    {ret.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">
                  {formatINR(ret.refundAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

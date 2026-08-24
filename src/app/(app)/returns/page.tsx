import Link from "next/link";
import { ArrowRight, CheckCircle2, Package, PackageCheck, RotateCcw, Truck, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { buttonClassName } from "@/components/ui/button";
import { formatINR } from "@/lib/calculations";
import { getCustomerReturns } from "@/lib/data/returns";

export default async function ReturnsPage() {
  const returns = await getCustomerReturns();

  return (
    <>
      <PageHeader
        title="Customer Returns (Reverse Pickups)"
        description="Manage customer-initiated return requests, reverse pickup tracking, and QC checks."
      >
        <Link
          href="/orders"
          className={`${buttonClassName({ variant: "outline" })} text-slate-700 hover:bg-slate-50`}
        >
          View All Orders
        </Link>
      </PageHeader>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Return AWB</th>
                <th className="py-3 px-4">Order &amp; Buyer</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Courier Partner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{ret.awb}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{ret.orderNumber}</p>
                    <p className="text-[11px] text-slate-500">
                      {ret.customerName} {ret.customerPhone ? `(${ret.customerPhone})` : ""}
                    </p>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{ret.returnReason}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{ret.courier}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        ret.status === "DELIVERED" || ret.status === "RTO_DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : ret.status === "NDR"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {ret.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatINR(ret.refundAmount)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/orders/${ret.orderId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Details</span>
                      <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}

              {returns.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500">
                    <Undo2 className="mx-auto size-9 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-800">No Customer Returns Found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      All your customer orders are fulfilling smoothly. When buyers initiate a return or reverse pickup, it will appear here with live QC updates.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/orders"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
                      >
                        <Package size={13} /> Manage Active Orders
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

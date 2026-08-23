import { AlertTriangle, Clock, RotateCcw, ShieldAlert, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatINR } from "@/lib/calculations";
import { getNdrCases } from "@/lib/data/ecommerce-shipments";
import { NdrActionModal } from "@/components/ndr/ndr-action-modal";

export default async function NdrPage() {
  const ndrCases = await getNdrCases();

  return (
    <>
      <PageHeader
        title="NDR (Non-Delivery Report) Management"
        description="Take instant action on delivery exceptions to prevent RTO losses and boost fulfillment success."
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">Shipment & AWB</th>
              <th className="py-3 px-4">Attempt #</th>
              <th className="py-3 px-4">Exception Reason</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Escalation Time</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {ndrCases.map((ndr) => (
              <tr key={ndr.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  <p className="text-sm font-bold text-indigo-600">SFX638291022</p>
                  <p className="text-[11px] text-slate-400">Order SW-84913 &bull; Shadowfax</p>
                </td>

                <td className="py-3 px-4">
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                    Attempt {ndr.attemptNumber}
                  </span>
                </td>

                <td className="py-3 px-4">
                  <p className="font-medium text-slate-800">{ndr.reasonDescription}</p>
                  {ndr.remark && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{ndr.remark}</p>
                  )}
                </td>

                <td className="py-3 px-4">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {ndr.ndrStatus}
                  </span>
                </td>

                <td className="py-3 px-4 text-slate-400 text-[11px]">
                  {ndr.escalatedAt?.slice(0, 16).replace("T", " ") || "Recently"}
                </td>

                <td className="py-3 px-4 text-right">
                  <NdrActionModal ndr={ndr} />
                </td>
              </tr>
            ))}

            {!ndrCases.length && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <ShieldAlert className="mx-auto size-8 text-emerald-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-800">No open NDR exceptions</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All deliveries are progressing normally with courier partners.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

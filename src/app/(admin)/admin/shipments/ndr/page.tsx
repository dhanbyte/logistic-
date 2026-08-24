import Link from "next/link";
import { AlertTriangle, Clock, RefreshCw, ShieldAlert, Truck } from "lucide-react";
import { getNdrCases } from "@/lib/data/ecommerce-shipments";

export default async function AdminNdrPage() {
  const ndrCases = await getNdrCases();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">NDR (Non-Delivery Report) Escalation Hub</h1>
        <p className="text-xs text-slate-500">
          Super Admin oversight on failed delivery attempts, rider remarks, and automated reattempts.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="py-3 px-4">AWB &amp; Order</th>
              <th className="py-3 px-4">Attempt #</th>
              <th className="py-3 px-4">Carrier Exception Reason</th>
              <th className="py-3 px-4">Escalation Status</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {ndrCases.map((ndr) => (
              <tr key={ndr.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-sm text-indigo-600">SFX638291022</p>
                  <p className="text-[11px] text-slate-400">Order SW-84913 &bull; Shadowfax</p>
                </td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold">
                    Attempt {ndr.attemptNumber}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">{ndr.reasonDescription}</td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                    {ndr.ndrStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">{ndr.escalatedAt?.slice(0, 16) || "Today"}</td>
                <td className="py-3 px-4 text-right">
                  <button className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                    Force Reattempt
                  </button>
                </td>
              </tr>
            ))}
            {!ndrCases.length && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No active NDR exceptions. All deliveries on track.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

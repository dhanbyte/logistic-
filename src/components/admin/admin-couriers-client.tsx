"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { testCourierConnectionAction } from "@/app/admin-actions";
import type { AdminCourierPartner } from "@/types/admin";

export function AdminCouriersClient({ couriers }: { couriers: AdminCourierPartner[] }) {
  const [testingCode, setTestingCode] = useState<string | null>(null);

  async function handleTestPing(code: string) {
    setTestingCode(code);
    const res = await testCourierConnectionAction(code);
    setTestingCode(null);
    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {couriers.map((c) => (
        <div
          key={c.id}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                  <span className="rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold px-1.5 py-0.2">
                    {c.environment}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{c.webhookUrl}</p>
              </div>

              <span
                className={`rounded-full font-bold text-[10px] px-2.5 py-0.5 flex items-center gap-1 ${
                  c.apiStatus === "HEALTHY"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    c.apiStatus === "HEALTHY" ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                  }`}
                ></span>
                {c.apiStatus}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="text-slate-500 font-medium block text-[11px]">Total Volume</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{c.totalShipments} Parcels</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="text-slate-500 font-medium block text-[11px]">Success Rate</span>
                <p className="font-bold text-emerald-700 text-sm mt-0.5">{c.successRate}%</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="text-slate-500 font-medium block text-[11px]">Avg SLA</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{c.avgDeliveryDays} Days</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              Status: <strong>{c.isActive ? "Active in Rate Registry" : "Standby"}</strong>
            </span>

            <button
              type="button"
              disabled={testingCode === c.code}
              onClick={() => handleTestPing(c.code)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw size={13} className={testingCode === c.code ? "animate-spin" : ""} />
              <span>{testingCode === c.code ? "Pinging API…" : "Test API Connection"}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

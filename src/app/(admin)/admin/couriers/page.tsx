"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Flame,
  Radio,
  RefreshCw,
  Scale,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { testCourierConnectionAction } from "@/app/admin-actions";

export default function AdminCouriersPage() {
  const [testingCode, setTestingCode] = useState<string | null>(null);

  const couriers = [
    {
      id: "cour-01",
      code: "shadowfax",
      name: "Shadowfax Express & Hyperlocal",
      apiStatus: "HEALTHY",
      isActive: true,
      codAvailable: true,
      prepaidAvailable: true,
      totalShipments: 1420,
      successRate: 97.8,
      avgDeliveryDays: 2.1,
      lastPingMs: 245,
      environment: "PRODUCTION",
      webhookUrl: "https://www.dhanbyte.me/api/webhooks/shadowfax",
    },
    {
      id: "cour-02",
      code: "xpressbees",
      name: "Xpressbees Surface & Air",
      apiStatus: "HEALTHY",
      isActive: true,
      codAvailable: true,
      prepaidAvailable: true,
      totalShipments: 890,
      successRate: 96.2,
      avgDeliveryDays: 2.8,
      lastPingMs: 310,
      environment: "PRODUCTION",
      webhookUrl: "https://www.dhanbyte.me/api/webhooks/xpressbees",
    },
    {
      id: "cour-03",
      code: "delhivery",
      name: "Delhivery Direct Logistics",
      apiStatus: "HEALTHY",
      isActive: true,
      codAvailable: true,
      prepaidAvailable: true,
      totalShipments: 2150,
      successRate: 98.4,
      avgDeliveryDays: 1.9,
      lastPingMs: 180,
      environment: "PRODUCTION",
      webhookUrl: "https://www.dhanbyte.me/api/webhooks/delhivery",
    },
    {
      id: "cour-04",
      code: "ekart",
      name: "Ekart Logistics (Flipkart Network)",
      apiStatus: "HEALTHY",
      isActive: true,
      codAvailable: true,
      prepaidAvailable: true,
      totalShipments: 650,
      successRate: 95.5,
      avgDeliveryDays: 3.0,
      lastPingMs: 420,
      environment: "PRODUCTION",
      webhookUrl: "https://www.dhanbyte.me/api/webhooks/ekart",
    },
  ];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Courier Partner Gateways</h1>
          <p className="text-xs text-slate-500">
            Monitor API endpoints, rate limits, live pings, and delivery success metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/couriers/api"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
          >
            <Activity size={15} className="text-indigo-600" />
            <span>API Logs &amp; Webhooks</span>
          </Link>
          <Link
            href="/admin/couriers/rates"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
          >
            <Scale size={15} />
            <span>Rate Slabs &amp; Margins</span>
          </Link>
        </div>
      </div>

      {/* Courier Grid */}
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

                <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse"></span> {c.apiStatus}
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
                Last Ping: <strong>{c.lastPingMs}ms</strong>
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
    </div>
  );
}

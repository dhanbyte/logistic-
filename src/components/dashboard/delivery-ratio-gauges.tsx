"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";

interface DeliveryGaugesProps {
  kpis: {
    totalOrders: number;
    readyToShip: number;
    inTransit: number;
    delivered: number;
    ndr: number;
    rto: number;
    deliveryRatio?: number;
    rtoRatio?: number;
    ndrRatio?: number;
    deliverySuccessRate?: number;
  };
}

export function DeliveryRatioGauges({ kpis }: DeliveryGaugesProps) {
  const totalDispatched = kpis.delivered + kpis.inTransit + kpis.ndr + kpis.rto;
  
  // Calculate Ratios
  const deliveryRatio =
    kpis.deliveryRatio ??
    (totalDispatched > 0 ? Number(((kpis.delivered / totalDispatched) * 100).toFixed(1)) : 0);

  const rtoRatio =
    kpis.rtoRatio ??
    (totalDispatched > 0 ? Number(((kpis.rto / totalDispatched) * 100).toFixed(1)) : 0);

  const ndrRatio =
    kpis.ndrRatio ??
    (totalDispatched > 0 ? Number(((kpis.ndr / totalDispatched) * 100).toFixed(1)) : 0);

  const inTransitRatio =
    totalDispatched > 0 ? Number(((kpis.inTransit / totalDispatched) * 100).toFixed(1)) : 0;

  // SVG Circle Dimensions
  const size = 140;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const deliveryStrokeDashoffset = circumference - (deliveryRatio / 100) * circumference;
  const rtoStrokeDashoffset = circumference - (rtoRatio / 100) * circumference;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-5 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Delivery &amp; RTO Performance Hub</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <ShieldCheck size={12} /> Live Ratio Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fulfillment success rates, courier SLA delivery ratio, and return mitigation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/ndr"
            className="rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 flex items-center gap-1"
          >
            <AlertTriangle size={12} />
            <span>NDR ({kpis.ndr})</span>
          </Link>
          <Link
            href="/rto"
            className="rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100 flex items-center gap-1"
          >
            <RotateCcw size={12} />
            <span>RTO ({kpis.rto})</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* 1. Circular Delivery Ratio Gauge */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white p-4 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
            Delivery Success Ratio
          </span>

          <div className="relative my-2 size-36">
            <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
              {/* Background Track Ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                className="stroke-slate-100"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#10b981"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={deliveryStrokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900">{deliveryRatio}%</span>
              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5">
                <CheckCircle2 size={10} /> {kpis.delivered} Delivered
              </span>
            </div>
          </div>

          <div className="mt-2 w-full rounded-xl bg-emerald-100/60 py-1.5 px-3 text-[11px] font-semibold text-emerald-800">
            {deliveryRatio >= 90
              ? "🎯 Excellent (> 90% Target)"
              : deliveryRatio >= 75
                ? "⚡ Healthy Performance"
                : "⚠️ Below 75% Benchmark"}
          </div>
        </div>

        {/* 2. Circular RTO Risk Ratio Gauge */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-gradient-to-b from-rose-50/40 to-white p-4 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2">
            RTO (Return) Ratio
          </span>

          <div className="relative my-2 size-36">
            <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
              {/* Background Track Ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                className="stroke-slate-100"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#f43f5e"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={rtoStrokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900">{rtoRatio}%</span>
              <span className="text-[10px] font-semibold text-rose-700 flex items-center gap-0.5">
                <RotateCcw size={10} /> {kpis.rto} Returned
              </span>
            </div>
          </div>

          <div className="mt-2 w-full rounded-xl bg-rose-100/60 py-1.5 px-3 text-[11px] font-semibold text-rose-800">
            {rtoRatio <= 5
              ? "🛡️ Safe RTO (&lt; 5% Target)"
              : rtoRatio <= 10
                ? "⚡ Moderate Risk (5-10%)"
                : "🚨 High RTO Alert (> 10%)"}
          </div>
        </div>

        {/* 3. In-Transit & Logistics Pipeline */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
          <div>
            <span className="text-xs font-bold text-slate-700">Fulfillment Breakdown</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Shipment status split</p>

            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" /> Delivered
                  </span>
                  <span className="font-bold text-slate-900">{kpis.delivered} ({deliveryRatio}%)</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, deliveryRatio)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" /> In-Transit / OFD
                  </span>
                  <span className="font-bold text-slate-900">{kpis.inTransit} ({inTransitRatio}%)</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, inTransitRatio)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500" /> RTO Shipments
                  </span>
                  <span className="font-bold text-slate-900">{kpis.rto} ({rtoRatio}%)</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.min(100, rtoRatio)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/shipments"
            className="mt-4 flex items-center justify-between rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <span>Inspect All Shipments</span>
            <ArrowRight size={13} className="text-indigo-600" />
          </Link>
        </div>

        {/* 4. NDR Actionable Advisor Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900">NDR Mitigation Engine</span>
              <span className="rounded-full bg-indigo-200/70 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                AI Auto-Escalate
              </span>
            </div>
            <p className="text-[11px] text-indigo-700/80 mt-1">
              Failed delivery attempts need buyer WhatsApp / IVR re-attempt instructions.
            </p>

            <div className="mt-4 rounded-xl bg-white p-3 border border-indigo-100 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Pending NDR Actions:</span>
                <span className="font-bold text-amber-600">{kpis.ndr} Parcels</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Auto-Reattempt Window:</span>
                <span className="font-semibold text-slate-800">24 Hours</span>
              </div>
            </div>
          </div>

          <Link
            href="/ndr"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
          >
            <AlertTriangle size={13} />
            <span>Resolve {kpis.ndr} NDR Cases Now</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

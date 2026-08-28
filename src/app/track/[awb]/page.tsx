import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { ShareTrackingWidget } from "@/components/shipments/share-tracking-widget";
import { getPublicTrackingData } from "@/lib/data/tracking";

export default async function PublicTrackingPage({
  params,
}: {
  params: Promise<{ awb: string }>;
}) {
  const { awb } = await params;
  const data = await getPublicTrackingData(awb);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      {/* Top Simple Nav */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Truck size={19} />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-slate-900 leading-tight">
                Shipwave Live Track
              </span>
              <span className="text-[9px] font-semibold tracking-wider uppercase text-indigo-600">
                Courier Tracking Network
              </span>
            </div>
          </Link>

          <Link
            href="/#tracking"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Search size={13} className="text-indigo-600" />
            <span>Track Another AWB</span>
          </Link>
        </div>
      </header>

      {/* Main Tracking View */}
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 flex-1 space-y-6">
        {data.isNotFound ? (
          <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-md max-w-xl mx-auto space-y-4">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <Package size={32} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Shipment Record Not Found</h1>
            <p className="text-sm text-slate-600">
              We couldn&apos;t find any active dispatch details for AWB{" "}
              <strong className="font-mono text-slate-900 font-bold">{data.awbNumber}</strong>.
            </p>
            <p className="text-xs text-slate-500">
              Please double check the AWB number with your merchant or tracking SMS notification.
            </p>
            <div className="pt-2">
              <Link
                href="/#tracking"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
              >
                <Search size={14} />
                <span>Search Another Tracking Number</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* 1. HERO SHIPMENT STATUS CARD */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    AWB: {data.awbNumber}
                  </span>
                  <span className="rounded-md bg-indigo-100 text-indigo-800 px-2 py-0.5 text-[11px] font-bold">
                    {data.courierName}
                  </span>
                  {data.orderNumber && (
                    <span className="text-xs text-slate-500 font-semibold">
                      Ref: {data.orderNumber}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>{data.currentStatusText}</span>
                </h1>

                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                  <MapPin size={14} className="text-indigo-600 shrink-0" />
                  <span>
                    Current Location: <strong className="text-slate-900">{data.currentLocation}</strong>
                  </span>
                </p>
              </div>

              {/* Share with Buyer Buttons */}
              <div className="shrink-0 self-start sm:self-auto">
                <ShareTrackingWidget
                  awbNumber={data.awbNumber}
                  orderNumber={data.orderNumber}
                  courierName={data.courierName}
                  destinationCity={data.destinationCity}
                />
              </div>
            </div>
          </div>

          {/* Key Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100 bg-white text-xs">
            <div className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Estimated Delivery
              </span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block flex items-center gap-1">
                <Calendar size={13} className="text-emerald-600" />
                {data.estimatedDeliveryDate}
              </span>
            </div>

            <div className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pickup Status
              </span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                {data.isPickedUp ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Handover Completed
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <Clock size={13} /> Awaiting Rider Handover
                  </span>
                )}
              </span>
            </div>

            <div className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Origin City
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {data.originCity} ({data.originPincode})
              </span>
            </div>

            <div className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Destination
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {data.destinationCity}, {data.destinationState} ({data.destinationPincode})
              </span>
            </div>
          </div>

          {/* 2. VISUAL 5-STAGE MILESTONE PROGRESS STEPPER */}
          <div className="p-6 bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
              Milestone Progress
            </h3>

            <div className="relative">
              {/* Stepper Line for Desktop */}
              <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
                {data.milestones.map((m, idx) => {
                  const isCompleted = m.status === "completed";
                  const isCurrent = m.status === "current";

                  return (
                    <div key={m.label} className="flex sm:flex-col items-start sm:items-center sm:text-center gap-3 sm:gap-2">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                          isCompleted
                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs"
                            : isCurrent
                            ? "bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse shadow-xs"
                            : "bg-slate-200 text-slate-500 border border-slate-300"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>

                      <div>
                        <p className={`text-xs font-bold ${isCompleted || isCurrent ? "text-slate-900" : "text-slate-500"}`}>
                          {m.label}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          {m.sublabel}
                        </p>
                        {m.timestamp && (
                          <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                            {m.timestamp}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. CHECKPOINTS SCAN TIMELINE & ROUTE DETAILS */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Detailed Activity Checkpoints (2 Cols) */}
          <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-indigo-600" />
                <span>Live Activity &amp; Transit History</span>
              </h3>
              <span className="text-xs text-slate-500">
                {data.checkpoints.length} Checkpoints Recorded
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {data.checkpoints.map((cp, idx) => (
                <div key={idx} className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 size-3.5 rounded-full border-2 border-white ring-2 ${
                      idx === 0
                        ? "bg-indigo-600 ring-indigo-200 animate-pulse"
                        : "bg-slate-400 ring-slate-100"
                    }`}
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900 leading-snug">
                      {cp.activity}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin size={11} className="text-slate-400 shrink-0" />
                      <span>{cp.location}</span>
                      <span>&bull;</span>
                      <span>{cp.timestamp}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consignee & Support Card (1 Col) */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User size={14} className="text-indigo-600" /> Delivery Consignee
              </h4>
              <p className="font-bold text-sm text-slate-900">{data.recipientName}</p>
              <p className="text-xs text-slate-600">
                Delivering to: <strong className="text-slate-900">{data.destinationCity}, {data.destinationState}</strong>
              </p>
              <p className="text-xs text-indigo-700 font-bold">Postal Code: {data.destinationPincode}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" /> Verified Carrier Network
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                This parcel is routed directly with <strong>{data.courierName}</strong>. Real-time telemetry is synced directly from origin warehouse to your doorstep.
              </p>
            </div>
          </div>
        </div>
        </>
        )}
      </main>

      {/* Public Tracking Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© 2026 Shipwave Logistics. Direct Courier Integration &amp; Public Tracking Engine.</p>

      </footer>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Printer,
  RotateCcw,
  Share2,
  ShieldAlert,
  Truck,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  PrintLabelButton,
  PrintManifestButton,
} from "@/components/shipments/print-label-button";
import { ShareTrackingWidget } from "@/components/shipments/share-tracking-widget";
import { formatINR } from "@/lib/calculations";
import { getEcommerceShipmentById } from "@/lib/data/ecommerce-shipments";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { shipment, trackingEvents, ndrCase, rtoShipment } = await getEcommerceShipmentById(id);

  if (!shipment) {
    notFound();
  }

  const isDelivered = shipment.shipmentStatus === "DELIVERED";
  const isOutForDelivery = shipment.shipmentStatus === "OUT_FOR_DELIVERY";
  const isInTransit = ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(shipment.shipmentStatus);
  const isPickedUp = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(shipment.shipmentStatus);

  const currentLocationStr = isDelivered
    ? `${shipment.order?.customer?.city || "Destination"}, ${shipment.order?.customer?.state || ""} (${shipment.deliveryPincode})`
    : isOutForDelivery
    ? `${shipment.order?.customer?.city || "Destination"} Local Delivery Hub`
    : isInTransit
    ? `En route to ${shipment.order?.customer?.city || "Destination"} Sort Center`
    : `${shipment.warehouse?.city || "Origin"} Hub (${shipment.pickupPincode})`;

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/shipments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Shipments
        </Link>

        <ShareTrackingWidget
          awbNumber={shipment.awbNumber}
          orderNumber={shipment.order?.orderNumber}
          courierName={shipment.courierProvider?.name}
          destinationCity={shipment.order?.customer?.city}
        />
      </div>

      <PageHeader
        title={`AWB: ${shipment.awbNumber}`}
        description={`Courier: ${shipment.courierProvider?.name} &bull; Order #${shipment.order?.orderNumber}`}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/track/${shipment.awbNumber}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <Compass size={14} />
            <span>Public Tracking Link</span>
            <ExternalLink size={12} />
          </Link>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              shipment.shipmentStatus === "DELIVERED"
                ? "bg-emerald-100 text-emerald-800"
                : shipment.shipmentStatus === "OUT_FOR_DELIVERY"
                  ? "bg-blue-100 text-blue-800"
                  : shipment.shipmentStatus === "NDR"
                    ? "bg-rose-100 text-rose-800"
                    : shipment.shipmentStatus === "RTO_INITIATED"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-indigo-100 text-indigo-800"
            }`}
          >
            {shipment.shipmentStatus.replace(/_/g, " ")}
          </span>
        </div>
      </PageHeader>

      {/* Real-time Location & Pickup Telemetry Banner */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Live Current Location
            </span>
            <p className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
              <MapPin size={15} className="text-indigo-600 shrink-0" />
              <span>{currentLocationStr}</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pickup &amp; Courier Handover
            </span>
            <p className="text-sm font-bold mt-1 flex items-center gap-1.5">
              {isPickedUp ? (
                <span className="text-emerald-700 font-black flex items-center gap-1">
                  <CheckCircle2 size={15} /> Handover Completed by Shadowfax Rider
                </span>
              ) : (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <Clock size={15} /> Awaiting Courier Rider Handover (Slot: Today 03-05 PM)
                </span>
              )}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Estimated Delivery
            </span>
            <p className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
              <Calendar size={15} className="text-emerald-600 shrink-0" />
              <span>{shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "In 2-3 Days"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* NDR Alert Banner if applicable */}
      {ndrCase && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/80 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-rose-100 text-rose-700 mt-0.5">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h4 className="text-sm font-bold text-rose-900">
                  Non-Delivery Exception (Attempt #{ndrCase.attemptNumber})
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">{ndrCase.reasonDescription}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Status: <strong className="uppercase">{ndrCase.ndrStatus}</strong>
                  {ndrCase.reattemptDate ? ` &bull; Reattempt: ${ndrCase.reattemptDate}` : ""}
                </p>
              </div>
            </div>
            <Link
              href="/ndr"
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs"
            >
              Take Action
            </Link>
          </div>
        </div>
      )}

      {/* RTO Alert Banner if applicable */}
      {rtoShipment && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50/80 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-orange-100 text-orange-700 mt-0.5">
              <RotateCcw size={20} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-orange-900">
                Return to Origin (RTO) Initiated
              </h4>
              <p className="text-xs text-orange-800 mt-0.5">
                Reason: {rtoShipment.reason} &bull; RTO AWB: {rtoShipment.rtoAwbNumber || "Pending"}
              </p>
              <p className="text-[11px] text-orange-700 mt-1">
                RTO Freight Surcharge: {formatINR(rtoShipment.rtoShippingCharge)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Tracking Milestones & Route */}
        <div className="space-y-6 lg:col-span-2">
          {/* Real-time Tracking Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Clock size={16} />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Milestone Tracking Timeline</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Est. Delivery:{" "}
                <strong className="text-slate-800">
                  {shipment.estimatedDeliveryDate || "In 2-3 Days"}
                </strong>
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {trackingEvents.map((event, idx) => (
                <div key={event.id} className="relative group">
                  <span
                    className={`absolute -left-6 top-0.5 size-3.5 rounded-full border-2 border-white ring-2 ${
                      idx === 0
                        ? "bg-indigo-600 ring-indigo-600/30"
                        : "bg-slate-400 ring-slate-200"
                    }`}
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">{event.activity}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {event.location ? `${event.location} • ` : ""}
                      {new Date(event.scanDatetime).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {!trackingEvents.length && (
                <div className="py-4 text-center text-xs text-slate-500">
                  AWB created &bull; Ready for Shadowfax courier rider pickup at origin hub.
                </div>
              )}
            </div>
          </div>

          {/* Route & Address Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Building2 size={14} className="text-indigo-600" /> Origin Warehouse
              </h4>
              <p className="font-bold text-sm text-slate-900">{shipment.warehouse?.warehouseName}</p>
              <p className="text-xs text-slate-600 mt-1">{shipment.warehouse?.addressLine1}</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {shipment.warehouse?.city}, {shipment.warehouse?.state} -{" "}
                <strong className="text-indigo-700">{shipment.pickupPincode}</strong>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Contact: {shipment.warehouse?.contactPerson} ({shipment.warehouse?.contactPhone})
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <User size={14} className="text-indigo-600" /> Buyer Destination
              </h4>
              <p className="font-bold text-sm text-slate-900">
                {shipment.order?.customer?.fullName || "Customer"}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {shipment.order?.customer?.addressLine1}
              </p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {shipment.order?.customer?.city}, {shipment.order?.customer?.state} -{" "}
                <strong className="text-indigo-700">{shipment.deliveryPincode}</strong>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Phone: {shipment.order?.customer?.phone}
              </p>
            </div>
          </div>

          {/* Shipping Documents */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" /> Shipping Documents & Labels
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <Printer size={18} className="text-slate-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">4x6 Thermal Barcode Label</p>
                    <p className="text-[10px] text-slate-400">Standard courier pickup format</p>
                  </div>
                </div>
                <PrintLabelButton labelUrl={shipment.labelUrl} />
              </div>

              <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <Download size={18} className="text-slate-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Courier Pickup Manifest</p>
                    <p className="text-[10px] text-slate-400">Handover verification sheet</p>
                  </div>
                </div>
                <PrintManifestButton manifestUrl={shipment.manifestUrl} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Logistics Financials & Package Details */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Logistics & Cost Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Courier Partner:</span>
                <span className="font-bold text-slate-800">{shipment.courierProvider?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Routing Hub Code:</span>
                <span className="font-mono font-bold text-indigo-600">
                  {shipment.routingCode || `SFX-${shipment.deliveryPincode}`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Dead Weight:</span>
                <span className="font-semibold text-slate-700">{shipment.weightKg} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Volumetric Weight:</span>
                <span className="font-semibold text-slate-700">{shipment.volumetricWeightKg} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Chargeable Weight:</span>
                <span className="font-bold text-indigo-900">{shipment.chargeableWeightKg} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    shipment.paymentMode === "COD"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {shipment.paymentMode}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Shipping Freight:</span>
                <span className="font-extrabold text-slate-900">
                  {formatINR(shipment.shippingCharge)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href={`/track/${shipment.awbNumber}`}
                target="_blank"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Compass size={14} />
                <span>Open Public Tracking Page</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

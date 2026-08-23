import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Package,
  Printer,
  RotateCcw,
  ShieldAlert,
  Truck,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  PrintLabelButton,
  PrintManifestButton,
} from "@/components/shipments/print-label-button";
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

  return (
    <>
      <div className="mb-4">
        <Link
          href="/shipments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Shipments
        </Link>
      </div>

      <PageHeader
        title={`AWB: ${shipment.awbNumber}`}
        description={`Courier: ${shipment.courierProvider?.name} &bull; Order #${shipment.order?.orderNumber}`}
      >
        <div className="flex items-center gap-2">
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
                  AWB created. Awaiting first scan at pickup hub.
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

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Courier Partner:</span>
                <span className="font-bold text-slate-900">
                  {shipment.courierProvider?.name || "Delhivery"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Routing Hub Code:</span>
                <span className="font-mono font-bold text-slate-800">
                  {shipment.routingCode || "BOM-400"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Dead Weight:</span>
                <span className="font-semibold text-slate-800">{shipment.weightKg} kg</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Volumetric Weight:</span>
                <span className="font-semibold text-slate-800">
                  {shipment.volumetricWeightKg} kg
                </span>
              </div>

              <div className="flex justify-between rounded-lg bg-indigo-50 p-2 border border-indigo-100">
                <span className="font-bold text-indigo-900">Chargeable Weight:</span>
                <span className="font-extrabold text-indigo-700">
                  {shipment.chargeableWeightKg} kg
                </span>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span
                    className={`font-bold rounded px-1.5 py-0.5 text-[10px] ${
                      shipment.paymentMode === "COD"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {shipment.paymentMode}
                  </span>
                </div>

                {shipment.paymentMode === "COD" && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">COD Collectible:</span>
                    <span className="font-bold text-slate-800">
                      {formatINR(shipment.codAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Seller Shipping Charge:</span>
                  <span className="font-bold text-slate-900">
                    {formatINR(shipment.shippingCharge)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Courier Cost:</span>
                  <span>{formatINR(shipment.courierCharge)}</span>
                </div>

                <div className="flex justify-between text-emerald-700 font-semibold border-t border-slate-100 pt-1.5">
                  <span>Aggregator Margin:</span>
                  <span>{formatINR(shipment.sellerMargin)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Printer,
  Sparkles,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { bookShipmentForOrder, fetchCourierRatesAction } from "@/app/ecommerce-actions";
import { formatINR } from "@/lib/calculations";
import {
  isCourierConfigured,
  isCourierTestMode,
} from "@/lib/couriers/registry";
import type { CourierRateQuote } from "@/lib/couriers/types";
import type { Order } from "@/types";

export function ShipNowModal({
  order,
  open,
  onClose,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}) {
  const [quotes, setQuotes] = useState<CourierRateQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<string>("xpressbees");
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    awbNumber: string;
    shipmentId: string;
    labelUrl?: string;
    courierName: string;
  } | null>(null);

  useEffect(() => {
    if (!open || !order) {
      setBookingSuccess(null);
      return;
    }

    async function loadRates() {
      if (!order) return;
      setLoadingQuotes(true);
      setBookingSuccess(null);

      const rates = await fetchCourierRatesAction({
        pickupPincode: order.warehouse?.pincode || "110020",
        deliveryPincode: order.customer?.pincode || "400050",
        weightKg: order.totalWeightKg || 0.5,
        lengthCm: order.lengthCm || 10,
        widthCm: order.widthCm || 10,
        heightCm: order.heightCm || 10,
        paymentMode: order.paymentMode,
        declaredValue: order.orderAmount,
      });

      setQuotes(rates);
      if (rates.length > 0) {
        const liveQuote = rates.find((q) => isCourierConfigured(q.courierCode));
        setSelectedCourier(liveQuote ? liveQuote.courierCode : rates[0].courierCode);
      }
      setLoadingQuotes(false);
    }

    loadRates();
  }, [open, order]);

  if (!open || !order) return null;

  async function handleBook() {
    if (!order) return;
    setBooking(true);

    const res = await bookShipmentForOrder(order.id, selectedCourier);
    setBooking(false);

    if (res.ok && res.data) {
      const selectedQuote = quotes.find((q) => q.courierCode === selectedCourier);
      const courierName = selectedQuote?.courierName || selectedCourier.toUpperCase();
      const awb = res.data.awbNumber;
      const labelUrl = `/shipments/${res.data.shipmentId}/label`;

      toast.success(`AWB ${awb} generated successfully with ${courierName}!`);
      setBookingSuccess({
        awbNumber: awb,
        shipmentId: res.data.shipmentId,
        labelUrl,
        courierName,
      });
    } else {
      toast.error((res as any).message || "Failed to book shipment.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <Truck size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ship Order {order.orderNumber}
              </h3>
              <p className="text-xs text-slate-500">
                {order.warehouse?.city} ({order.warehouse?.pincode}) &rarr; {order.customer?.city} (
                {order.customer?.pincode}) &bull; {order.totalWeightKg} kg &bull;{" "}
                <span className="font-semibold">{order.paymentMode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {bookingSuccess ? (
          /* Post-Booking Success Screen */
          <div className="py-6 space-y-5 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={28} />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900">Shipment Booked Successfully!</h4>
              <p className="text-xs text-slate-500 mt-1">
                AWB generated with <strong className="text-slate-800">{bookingSuccess.courierName}</strong>
              </p>
              <div className="mt-3 inline-block rounded-xl bg-slate-100 px-4 py-2 text-center">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  AWB Tracking Number
                </span>
                <span className="text-lg font-mono font-extrabold text-indigo-700">
                  {bookingSuccess.awbNumber}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`/shipments/${bookingSuccess.shipmentId}/label`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer size={14} /> View & Print 4x6 Label
              </a>

              <Link
                href={`/shipments/${bookingSuccess.shipmentId}`}
                onClick={onClose}
                className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={14} /> Track Shipment
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close & Return to Orders
              </button>
            </div>
          </div>
        ) : (
          /* Courier Selection Screen */
          <>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Select Courier Partner & Service
                </label>
                <span className="text-[11px] text-slate-400">Sorted by lowest cost</span>
              </div>

              {loadingQuotes ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="mx-auto size-6 animate-spin text-indigo-600 mb-2" />
                  <p className="text-xs">Checking real-time courier serviceability and rates…</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {[...quotes]
                    .sort((a, b) => {
                      const aLive = isCourierConfigured(a.courierCode) ? 1 : 0;
                      const bLive = isCourierConfigured(b.courierCode) ? 1 : 0;
                      if (bLive !== aLive) return bLive - aLive;
                      return a.totalShippingCost - b.totalShippingCost;
                    })
                    .map((q, idx) => {
                      const isSelected = selectedCourier === q.courierCode;
                      const isLive = isCourierConfigured(q.courierCode);
                      const isTest = isCourierTestMode(q.courierCode);

                      return (
                        <div
                          key={q.courierCode}
                          onClick={() => setSelectedCourier(q.courierCode)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{q.courierName}</span>
                                {isLive ? (
                                  !isTest ? (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 flex items-center gap-0.5 shadow-xs">
                                      <Zap size={9} /> LIVE API CONNECTED
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-900 flex items-center gap-0.5 shadow-xs">
                                      <Zap size={9} /> TEST MODE (LIVE RATES)
                                    </span>
                                  )
                                ) : (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">
                                    MOCK SIMULATOR
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Est. Delivery: {q.estimatedDeliveryDays} days &bull; Chargeable: {q.chargeableWeightKg} kg &bull; Rating: ★ {q.rating}
                              </p>
                            </div>
                          </div>

                        <div className="text-right shrink-0">
                          <p className="text-base font-extrabold text-slate-900">
                            {formatINR(q.totalShippingCost)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Freight: {formatINR(q.freightCharge)}
                            {q.codCharge > 0 ? ` + COD: ${formatINR(q.codCharge)}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                {isCourierConfigured(selectedCourier) && !isCourierTestMode(selectedCourier) ? (
                  <>
                    Amount will be deducted from your <strong className="text-slate-800">Prepaid Wallet</strong> upon live AWB generation.
                  </>
                ) : isCourierConfigured(selectedCourier) && isCourierTestMode(selectedCourier) ? (
                  <>
                    <span className="font-semibold text-amber-700">Test Mode:</span> Real courier booking disabled.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-700">Simulator Mode:</span> Generates mock test tracking AWB.
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={booking || loadingQuotes || quotes.length === 0 || !selectedCourier}
                  onClick={handleBook}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {booking && <Loader2 className="size-3.5 animate-spin" />}
                  {booking ? "Processing…" : "Confirm & Generate AWB"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle,
  CreditCard,
  ExternalLink,
  IndianRupee,
  Loader2,
  Package,
  Plus,
  Printer,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
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
  const [walletBalance, setWalletBalance] = useState<number>(5000);
  const [recharging, setRecharging] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    awbNumber: string;
    shipmentId: string;
    labelUrl?: string;
    courierName: string;
    chargeableWeight: number;
    amountDeducted: number;
  } | null>(null);

  // Volumetric vs Dead Weight
  const deadWeight = order?.totalWeightKg || 0.5;
  const length = order?.lengthCm || 10;
  const width = order?.widthCm || 10;
  const height = order?.heightCm || 10;
  const volumetricWeight = (length * width * height) / 5000;
  const chargeableWeight = Math.max(deadWeight, volumetricWeight);
  const isVolumetricHigher = volumetricWeight > deadWeight;

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
        weightKg: deadWeight,
        lengthCm: length,
        widthCm: width,
        heightCm: height,
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
  }, [open, order, deadWeight, length, width, height]);

  if (!open || !order) return null;

  const selectedQuote = quotes.find((q) => q.courierCode === selectedCourier);
  const requiredAmount = selectedQuote ? selectedQuote.totalShippingCost : 49;
  const hasLowBalance = walletBalance < requiredAmount;

  async function handleQuickRecharge(amount: number) {
    setRecharging(true);
    try {
      // Direct instant test recharge
      setWalletBalance((prev) => prev + amount);
      toast.success(`Wallet topped up by ${formatINR(amount)}! You can now book this shipment.`);
    } catch {
      toast.error("Recharge failed.");
    } finally {
      setRecharging(false);
    }
  }

  async function handleBook() {
    if (!order) return;
    setBooking(true);

    const res = await bookShipmentForOrder(order.id, selectedCourier);
    setBooking(false);

    if (res.ok && res.data) {
      const courierName = selectedQuote?.courierName || selectedCourier.toUpperCase();
      const awb = res.data.awbNumber;
      const labelUrl = res.data.labelUrl || `/shipments/${res.data.shipmentId}/label`;

      setWalletBalance((prev) => Math.max(0, prev - requiredAmount));
      toast.success(`AWB ${awb} generated successfully! Deducted ${formatINR(requiredAmount)} from wallet.`);

      setBookingSuccess({
        awbNumber: awb,
        shipmentId: res.data.shipmentId,
        labelUrl,
        courierName,
        chargeableWeight,
        amountDeducted: requiredAmount,
      });
    } else {
      toast.error((res as any).message || "Failed to book shipment.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
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
                {order.customer?.pincode}) &bull; <span className="font-semibold">{order.paymentMode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
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
              <h4 className="text-lg font-bold text-slate-900">Shipment Booked &amp; Freight Deducted!</h4>
              <p className="text-xs text-slate-500 mt-1">
                AWB generated with <strong className="text-slate-800">{bookingSuccess.courierName}</strong>
              </p>
              <div className="mt-3 inline-block rounded-xl bg-slate-100 px-5 py-2.5 text-center border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  AWB Tracking Number
                </span>
                <span className="text-xl font-mono font-black text-indigo-700">
                  {bookingSuccess.awbNumber}
                </span>
              </div>
            </div>

            {/* Deduction Ledger Notice */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900 text-left flex items-start gap-2.5">
              <Wallet size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Deducted {formatINR(bookingSuccess.amountDeducted)} from Prepaid Wallet
                </p>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Charged on Chargeable Weight: <strong>{bookingSuccess.chargeableWeight.toFixed(2)} kg</strong>. Recorded in{" "}
                  <Link href="/wallet" onClick={onClose} className="font-bold underline hover:text-indigo-950">
                    Wallet Transactions Ledger
                  </Link>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={bookingSuccess.labelUrl || `/shipments/${bookingSuccess.shipmentId}/label`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer size={15} /> Print 4x6 Shipping Label
              </a>

              <Link
                href={`/shipments/${bookingSuccess.shipmentId}`}
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={14} /> Track Parcel Live
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close &amp; Return to Orders
              </button>
            </div>
          </div>
        ) : (
          /* Courier Selection & Dynamic Weight Screen */
          <div className="mt-4 space-y-4">
            {/* Dynamic Volumetric & Dead Weight Calculation Banner */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale size={14} className="text-indigo-600" /> Dynamic Weight Calculation (L × B × H)
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isVolumetricHigher
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isVolumetricHigher ? "Volumetric Weight Applied" : "Dead Weight Applied"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] pt-2 border-t border-slate-200/60">
                <div className="rounded-lg bg-white p-1.5 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Dead Weight</span>
                  <span className="font-bold text-slate-800">{deadWeight.toFixed(2)} kg</span>
                </div>
                <div className="rounded-lg bg-white p-1.5 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Dimensions</span>
                  <span className="font-bold text-slate-800">{length}×{width}×{height} cm</span>
                </div>
                <div className="rounded-lg bg-indigo-50/80 p-1.5 border border-indigo-200">
                  <span className="text-indigo-700 block text-[10px] font-bold">Chargeable Weight</span>
                  <span className="font-black text-indigo-900">{chargeableWeight.toFixed(2)} kg</span>
                </div>
              </div>
            </div>

            {/* Low Wallet Balance Warning & 1-Click Quick Recharge */}
            {hasLowBalance && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-xs space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900">Insufficient Wallet Balance</h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Required for shipping: <strong>{formatINR(requiredAmount)}</strong> &bull; Available in wallet: <strong>{formatINR(walletBalance)}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-amber-950">1-Click Topup:</span>
                  <button
                    type="button"
                    disabled={recharging}
                    onClick={() => handleQuickRecharge(500)}
                    className="rounded-lg bg-amber-600 hover:bg-amber-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer"
                  >
                    + ₹500
                  </button>
                  <button
                    type="button"
                    disabled={recharging}
                    onClick={() => handleQuickRecharge(1000)}
                    className="rounded-lg bg-amber-700 hover:bg-amber-800 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer"
                  >
                    + ₹1,000
                  </button>
                  <Link
                    href="/wallet"
                    target="_blank"
                    className="ml-auto text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    Custom Recharge &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Courier Selection List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Select Courier Partner
                </label>
                <span className="text-[11px] text-slate-400">Sorted by lowest cost</span>
              </div>

              {loadingQuotes ? (
                <div className="py-10 text-center text-slate-500">
                  <Loader2 className="mx-auto size-6 animate-spin text-indigo-600 mb-2" />
                  <p className="text-xs">Calculating dynamic weight rates across courier APIs…</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {[...quotes]
                    .sort((a, b) => a.totalShippingCost - b.totalShippingCost)
                    .map((q) => {
                      const isSelected = selectedCourier === q.courierCode;
                      const isLive = isCourierConfigured(q.courierCode);

                      return (
                        <div
                          key={q.courierCode}
                          onClick={() => setSelectedCourier(q.courierCode)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
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
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900">{q.courierName}</span>
                                {isLive && (
                                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[8px] font-bold text-emerald-800">
                                    LIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                SLA: {q.estimatedDeliveryDays} days &bull; Weight: {chargeableWeight.toFixed(2)} kg
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-extrabold text-slate-900">
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

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <div>
                <span className="text-slate-500">Wallet Balance:</span>{" "}
                <strong className={hasLowBalance ? "text-rose-600" : "text-emerald-700"}>
                  {formatINR(walletBalance)}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={booking || loadingQuotes || quotes.length === 0}
                  onClick={handleBook}
                  className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  {booking && <Loader2 className="size-3.5 animate-spin" />}
                  <span>{booking ? "Booking Parcel…" : "Confirm & Generate AWB"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

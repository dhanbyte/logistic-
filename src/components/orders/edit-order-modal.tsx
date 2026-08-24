"use client";

import { useEffect, useState } from "react";
import { Edit3, Package, User, X } from "lucide-react";
import { toast } from "sonner";
import { updateOrderAction } from "@/app/ecommerce-actions";
import type { Order } from "@/types";

export function EditOrderModal({
  order,
  open,
  onClose,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  // Customer State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Order & Package State
  const [paymentMode, setPaymentMode] = useState<"PREPAID" | "COD">("PREPAID");
  const [orderAmount, setOrderAmount] = useState(0);
  const [codAmount, setCodAmount] = useState(0);
  const [weightKg, setWeightKg] = useState(0.5);
  const [lengthCm, setLengthCm] = useState(10);
  const [widthCm, setWidthCm] = useState(10);
  const [heightCm, setHeightCm] = useState(10);

  // Item State
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sku, setSku] = useState("");

  useEffect(() => {
    if (order) {
      setCustomerName(order.customer?.fullName || "");
      setCustomerPhone(order.customer?.phone || "");
      setCustomerEmail(order.customer?.email || "");
      setAddressLine1(order.customer?.addressLine1 || "");
      setCity(order.customer?.city || "");
      setState(order.customer?.state || "");
      setPincode(order.customer?.pincode || "");

      setPaymentMode(order.paymentMode);
      setOrderAmount(order.orderAmount);
      setCodAmount(order.codAmount || order.orderAmount);
      setWeightKg(order.totalWeightKg || 0.5);
      setLengthCm(order.lengthCm || 10);
      setWidthCm(order.widthCm || 10);
      setHeightCm(order.heightCm || 10);

      const firstItem = order.items?.[0];
      setProductName(firstItem?.productName || "Product Item");
      setQuantity(firstItem?.quantity || 1);
      setSku(firstItem?.sku || "");
    }
  }, [order]);

  if (!open || !order) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !pincode.trim() || !addressLine1.trim()) {
      toast.error("Please fill in all mandatory customer and destination fields.");
      return;
    }

    setLoading(true);
    const res = await updateOrderAction(order!.id, {
      customerName,
      customerPhone,
      customerEmail,
      addressLine1,
      city,
      state,
      pincode,
      paymentMode,
      orderAmount: Number(orderAmount),
      codAmount: paymentMode === "COD" ? Number(codAmount) : 0,
      weightKg: Number(weightKg),
      lengthCm: Number(lengthCm),
      widthCm: Number(widthCm),
      heightCm: Number(heightCm),
      productName,
      quantity: Number(quantity),
      sku,
    });
    setLoading(false);

    if (res.ok) {
      toast.success(res.message || "Order updated successfully!");
      onClose();
    } else {
      toast.error(res.message || "Failed to update order.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <Edit3 size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Order: {order.orderNumber}</h3>
              <p className="text-xs text-slate-500">Update customer details, parcel dimensions and payment mode.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-5">
          {/* Section 1: Customer & Delivery Details */}
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              <User size={13} /> Customer &amp; Delivery Address
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Package & Dimensions */}
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              <Package size={13} /> Package Weight &amp; Dimensions
            </h4>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dead Wt (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Length (cm)</label>
                <input
                  type="number"
                  required
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Width (cm)</label>
                <input
                  type="number"
                  required
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment & Pricing */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Payment &amp; Item Details
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                >
                  <option value="PREPAID">Prepaid</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Order Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {paymentMode === "COD" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">COD Collect (₹)</label>
                  <input
                    type="number"
                    required
                    value={codAmount}
                    onChange={(e) => setCodAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-amber-700 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              )}

              <div className="col-span-3 grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? "Saving Changes…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

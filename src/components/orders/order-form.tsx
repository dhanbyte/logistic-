"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Package,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { createEcommerceOrder } from "@/app/ecommerce-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { calculateChargeableWeight, formatINR } from "@/lib/calculations";
import type { Warehouse } from "@/types";

export function OrderForm({ warehouses }: { warehouses: Warehouse[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Dynamic form calculations
  const [paymentMode, setPaymentMode] = useState<"PREPAID" | "COD">("PREPAID");
  const [orderAmount, setOrderAmount] = useState<string>("1499");
  const [codAmount, setCodAmount] = useState<string>("1499");
  const [weightKg, setWeightKg] = useState<string>("0.5");
  const [lengthCm, setLengthCm] = useState<string>("15");
  const [widthCm, setWidthCm] = useState<string>("10");
  const [heightCm, setHeightCm] = useState<string>("8");
  const [pincode, setPincode] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");

  const weightCalc = calculateChargeableWeight(Number(weightKg) || 0.5, {
    lengthCm: Number(lengthCm) || 10,
    widthCm: Number(widthCm) || 10,
    heightCm: Number(heightCm) || 10,
  });

  function handlePincodeChange(value: string) {
    setPincode(value);
    if (value.length >= 2) {
      const prefix = value.slice(0, 2);
      if (prefix === "11") {
        setCity("New Delhi");
        setState("Delhi");
      } else if (prefix === "40") {
        setCity("Mumbai");
        setState("Maharashtra");
      } else if (prefix === "56") {
        setCity("Bengaluru");
        setState("Karnataka");
      } else if (prefix === "50") {
        setCity("Hyderabad");
        setState("Telangana");
      } else if (prefix === "60") {
        setCity("Chennai");
        setState("Tamil Nadu");
      } else if (prefix === "70") {
        setCity("Kolkata");
        setState("West Bengal");
      } else if (prefix === "20") {
        setCity("Noida");
        setState("Uttar Pradesh");
      } else if (prefix === "12") {
        setCity("Gurugram");
        setState("Haryana");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    const form = new FormData(e.currentTarget);
    const res = await createEcommerceOrder(form);
    setLoading(false);

    if (res.ok) {
      toast.success("Order created successfully!");
      router.push("/orders");
      router.refresh();
    } else {
      toast.error(res.message);
      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Customer & Order Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Pickup Warehouse */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Building2 size={16} />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Pickup Warehouse</h3>
              </div>
              <Link
                href="/warehouses"
                target="_blank"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                + Add / Manage Hubs
              </Link>
            </div>
            <div>
              <Label htmlFor="warehouseId">Select Origin Warehouse</Label>
              <select
                id="warehouseId"
                name="warehouseId"
                required
                defaultValue={warehouses[0]?.id}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName} &bull; {w.city} ({w.pincode}) {w.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
              {fieldErrors.warehouseId && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.warehouseId[0]}</p>
              )}
            </div>
          </div>

          {/* 2. Customer Delivery Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <User size={16} />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Buyer Delivery Details</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customerName">Customer Full Name *</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  placeholder="e.g. Aarav Sharma"
                />
                {fieldErrors.customerName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.customerName[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="customerPhone">Mobile Number (10 digits) *</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                />
                {fieldErrors.customerPhone && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.customerPhone[0]}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="customerEmail">Email Address</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  placeholder="e.g. customer@example.com"
                />
                {fieldErrors.customerEmail && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.customerEmail[0]}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="addressLine1">Complete Address / Street *</Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  required
                  placeholder="Flat / House No, Building, Street, Area"
                />
                {fieldErrors.addressLine1 && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.addressLine1[0]}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="addressLine2">Landmark / Locality</Label>
                <Input
                  id="addressLine2"
                  name="addressLine2"
                  placeholder="e.g. Near HDFC Bank"
                />
                {fieldErrors.addressLine2 && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.addressLine2[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="pincode">6-Digit Indian PIN Code *</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  placeholder="e.g. 400050"
                />
                {fieldErrors.pincode && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.pincode[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                />
                {fieldErrors.city && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.city[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                />
                {fieldErrors.state && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.state[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Product & Package Specs */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <Package size={16} />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Product & Package Specifications</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="orderNumber">Order Reference # *</Label>
                <Input
                  id="orderNumber"
                  name="orderNumber"
                  required
                  defaultValue={`ORD-${Date.now().toString().slice(-6)}`}
                />
                {fieldErrors.orderNumber && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.orderNumber[0]}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  name="productName"
                  required
                  placeholder="e.g. Wireless Bluetooth Earbuds Pro"
                />
                {fieldErrors.productName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.productName[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="productSku">SKU / Item Code</Label>
                <Input
                  id="productSku"
                  name="productSku"
                  placeholder="e.g. AUD-EAR-01"
                />
                {fieldErrors.productSku && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.productSku[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  required
                  defaultValue={1}
                />
                {fieldErrors.quantity && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentMode">Payment Mode *</Label>
                <select
                  id="paymentMode"
                  name="paymentMode"
                  value={paymentMode}
                  onChange={(e) => {
                    const mode = e.target.value as "PREPAID" | "COD";
                    setPaymentMode(mode);
                    if (mode === "COD" && (!codAmount || codAmount === "0")) {
                      setCodAmount(orderAmount);
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                >
                  <option value="PREPAID">Prepaid</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="orderAmount">Total Order Value (₹) *</Label>
                <Input
                  id="orderAmount"
                  name="orderAmount"
                  type="number"
                  min={1}
                  required
                  value={orderAmount}
                  onChange={(e) => {
                    setOrderAmount(e.target.value);
                    if (paymentMode === "COD") setCodAmount(e.target.value);
                  }}
                />
                {fieldErrors.orderAmount && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.orderAmount[0]}</p>
                )}
              </div>

              {paymentMode === "COD" && (
                <div>
                  <Label htmlFor="codAmount">COD Collection Amount (₹) *</Label>
                  <Input
                    id="codAmount"
                    name="codAmount"
                    type="number"
                    min={1}
                    required
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                  />
                  {fieldErrors.codAmount && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.codAmount[0]}</p>
                  )}
                </div>
              )}
            </div>

            {/* Package Dimensions & Weight */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid gap-3 sm:grid-cols-4">
              <div>
                <Label htmlFor="weightKg">Dead Weight (kg) *</Label>
                <Input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  step="0.05"
                  min="0.05"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
                {fieldErrors.weightKg && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.weightKg[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lengthCm">Length (cm) *</Label>
                <Input
                  id="lengthCm"
                  name="lengthCm"
                  type="number"
                  min={1}
                  required
                  value={lengthCm}
                  onChange={(e) => setLengthCm(e.target.value)}
                />
                {fieldErrors.lengthCm && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.lengthCm[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="widthCm">Width (cm) *</Label>
                <Input
                  id="widthCm"
                  name="widthCm"
                  type="number"
                  min={1}
                  required
                  value={widthCm}
                  onChange={(e) => setWidthCm(e.target.value)}
                />
                {fieldErrors.widthCm && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.widthCm[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="heightCm">Height (cm) *</Label>
                <Input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  min={1}
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
                {fieldErrors.heightCm && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.heightCm[0]}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Summary & Live Weight Box */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sticky top-20">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Package & Weight Summary
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dead Weight:</span>
                <span className="font-semibold text-slate-800">{weightCalc.deadWeightKg} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Volumetric Weight:</span>
                <span className="font-semibold text-slate-800">
                  {weightCalc.volumetricWeightKg} kg
                </span>
              </div>
              <div className="rounded-lg bg-indigo-50 p-3 flex items-center justify-between border border-indigo-100">
                <span className="font-bold text-indigo-900">Chargeable Weight:</span>
                <span className="text-sm font-extrabold text-indigo-700">
                  {weightCalc.chargeableWeightKg} kg
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formula: (L &times; W &times; H)/5000. Couriers bill on the higher of dead vs volumetric weight.
              </p>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Order Payment:</span>
                  <span className="font-bold text-slate-800">{paymentMode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Order Amount:</span>
                  <span className="font-bold text-slate-800">
                    {formatINR(Number(orderAmount) || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Creating Order…" : "Create Customer Order"}
              </Button>

              <Link
                href="/orders"
                className="block text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
              >
                Cancel & Return
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

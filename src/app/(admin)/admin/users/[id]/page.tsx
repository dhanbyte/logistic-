"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  ExternalLink,
  Gift,
  History,
  IndianRupee,
  Lock,
  Mail,
  Package,
  Phone,
  Radio,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Truck,
  User,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/calculations";
import { toggleUserStatusAction, updateMerchantUserAction } from "@/app/admin-actions";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = String(params.id || "usr-1");

  const [fullName, setFullName] = useState("Dhananjay");
  const [email, setEmail] = useState("dhananjay.win2004@gmail.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [companyName, setCompanyName] = useState("Dhanbyte Logistics Pvt Ltd");
  const [status, setStatus] = useState<"ACTIVE" | "BLOCKED" | "DEACTIVATED">("ACTIVE");
  const [billingMode, setBillingMode] = useState<"PREPAID_WALLET" | "POSTPAID_COD_DEDUCT">("PREPAID_WALLET");
  const [creditLimit, setCreditLimit] = useState(2000);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [courierAccess, setCourierAccess] = useState({
    shadowfax: true,
    xpressbees: true,
    delhivery: true,
    ekart: false,
    dtdc: false,
  });

  // Performance 360 KPIs for this user
  const stats = {
    totalOrders: 142,
    deliveredOrders: 137,
    deliveryRatePercent: 96.4,
    ndrExceptions: 3,
    rtoParcels: 2,
    rtoRatePercent: 1.4,
    totalShippingSpent: 18450,
    totalCodCollected: 124800,
    netPayableToMerchant: 106350,
    walletBalance: 15400,
    freeCredit: 500,
    pendingRemittance: 14982.3,
  };

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateMerchantUserAction({
      userId,
      fullName,
      email,
      phone,
      companyName,
      status,
      billingMode,
      creditLimit: Number(creditLimit),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(res.message);
      setIsEditing(false);
    } else {
      toast.error(res.message);
    }
  }

  async function handleToggleStatus() {
    const newStatus = status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    setLoading(true);
    const res = await toggleUserStatusAction(userId, fullName, newStatus);
    setLoading(false);
    if (res.ok) {
      setStatus(newStatus);
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/users" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft size={13} /> Back to Users List
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700">Merchant 360 View</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{companyName}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            User ID: <span className="font-mono text-slate-700 font-semibold">{userId}</span> &bull; {fullName} ({email})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/users/${userId}/rates`}
            className="rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 shadow-xs flex items-center gap-1.5"
          >
            <Scale size={15} />
            <span>Assign Courier Rates</span>
          </Link>
          <Link
            href={`/admin/finance/wallet?userId=${userId}`}
            className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs flex items-center gap-1.5"
          >
            <Wallet size={15} />
            <span>Adjust Wallet</span>
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={handleToggleStatus}
            className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              status === "ACTIVE"
                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {status === "ACTIVE" ? "Block Account" : "Unblock Account"}
          </button>
        </div>
      </div>

      {/* Operational Delivery & Performance Ratios (4 KPIs) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Delivery Ratio */}
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50/70 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Delivery Success Ratio
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-700 tracking-tight">
            {stats.deliveryRatePercent}%
          </p>
          <p className="mt-1 text-[11px] text-emerald-800 font-medium">
            {stats.deliveredOrders} Delivered of {stats.totalOrders} Dispatched
          </p>
        </div>

        {/* NDR & RTO Rate */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              RTO / Return Ratio
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-rose-600 text-white">
              <RotateCcw size={16} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-rose-700 tracking-tight">
            {stats.rtoRatePercent}%
          </p>
          <p className="mt-1 text-[11px] text-rose-700">
            {stats.rtoParcels} RTOs &bull; {stats.ndrExceptions} NDR Exceptions
          </p>
        </div>

        {/* Total COD Collected & Net Receivable */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              COD Receivable Net
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-teal-600 text-white">
              <Banknote size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-teal-800 tracking-tight">
            {formatINR(stats.netPayableToMerchant)}
          </p>
          <p className="mt-1 text-[11px] text-teal-700">
            Gross: {formatINR(stats.totalCodCollected)}
          </p>
        </div>

        {/* Wallet Balance & Free Credit */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Wallet + Free Credit
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
              <Wallet size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-700 tracking-tight">
            {formatINR(stats.walletBalance + stats.freeCredit)}
          </p>
          <p className="mt-1 text-[11px] text-indigo-900 font-medium">
            Cash: {formatINR(stats.walletBalance)} &bull; Credit: {formatINR(stats.freeCredit)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Account Details & Billing Model Configuration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-600" /> Merchant Account &amp; Billing Mode
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 size={13} />
              <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>
            </div>

            {/* Freight Deduction Mode Selector */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
              <label className="block font-bold text-slate-900">
                Payment Collection &amp; Freight Deduction Rule
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label
                  className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                    billingMode === "PREPAID_WALLET"
                      ? "border-indigo-600 bg-white shadow-xs"
                      : "border-slate-200 bg-white/60 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="billingMode"
                    disabled={!isEditing}
                    checked={billingMode === "PREPAID_WALLET"}
                    onChange={() => setBillingMode("PREPAID_WALLET")}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Prepaid Wallet (Advance)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Order dispatch se pehle wallet se paise cut honge.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                    billingMode === "POSTPAID_COD_DEDUCT"
                      ? "border-indigo-600 bg-white shadow-xs"
                      : "border-slate-200 bg-white/60 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="billingMode"
                    disabled={!isEditing}
                    checked={billingMode === "POSTPAID_COD_DEDUCT"}
                    onChange={() => setBillingMode("POSTPAID_COD_DEDUCT")}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Postpaid COD Settlement</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Advance nahi lenge. Delivery ke baad COD me se cut hoga.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {loading ? "Saving Changes…" : "Save Configuration"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Courier Partners Activation Matrix */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Radio size={16} className="text-indigo-600" /> Assigned Courier Partners
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            Enable or disable specific courier partners available for this seller&apos;s checkout.
          </p>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
              <div>
                <span className="font-bold text-slate-900 block">Shadowfax Express</span>
                <span className="text-[10px] text-slate-400">Hyperlocal &amp; Air Forward</span>
              </div>
              <input
                type="checkbox"
                checked={courierAccess.shadowfax}
                onChange={(e) =>
                  setCourierAccess((prev) => ({ ...prev, shadowfax: e.target.checked }))
                }
                className="size-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
              <div>
                <span className="font-bold text-slate-900 block">Xpressbees Surface</span>
                <span className="text-[10px] text-slate-400">Pan-India B2C</span>
              </div>
              <input
                type="checkbox"
                checked={courierAccess.xpressbees}
                onChange={(e) =>
                  setCourierAccess((prev) => ({ ...prev, xpressbees: e.target.checked }))
                }
                className="size-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
              <div>
                <span className="font-bold text-slate-900 block">Delhivery Direct</span>
                <span className="text-[10px] text-slate-400">Express &amp; Heavy Cargo</span>
              </div>
              <input
                type="checkbox"
                checked={courierAccess.delhivery}
                onChange={(e) =>
                  setCourierAccess((prev) => ({ ...prev, delhivery: e.target.checked }))
                }
                className="size-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
              <div>
                <span className="font-bold text-slate-900 block">Ekart Logistics</span>
                <span className="text-[10px] text-slate-400">Tier 2/3 Specialist</span>
              </div>
              <input
                type="checkbox"
                checked={courierAccess.ekart}
                onChange={(e) =>
                  setCourierAccess((prev) => ({ ...prev, ekart: e.target.checked }))
                }
                className="size-4 text-indigo-600 rounded"
              />
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link
              href={`/admin/users/${userId}/rates`}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-xs"
            >
              <Scale size={14} />
              <span>Customize Courier Rates for {fullName} &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

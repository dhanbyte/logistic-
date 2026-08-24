"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Lock,
  Radio,
  Save,
  Settings,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);

  // Settings State
  const [companyName, setCompanyName] = useState("ShipWave Logistics Technologies Pvt Ltd");
  const [supportEmail, setSupportEmail] = useState("support@shipwave.in");
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");
  const [gstin, setGstin] = useState("24AAACG1234A1Z5");
  const [lowWalletThreshold, setLowWalletThreshold] = useState(500);
  const [minRecharge, setMinRecharge] = useState(500);
  const [remittanceFee, setRemittanceFee] = useState(15);

  const [notifications, setNotifications] = useState({
    whatsapp: true,
    sms: true,
    email: true,
    inApp: true,
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("System configurations saved successfully.");
    }, 500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform System Settings</h1>
        <p className="text-xs text-slate-500">
          Configure business profile, payment gateways, wallet threshold alerts, and multi-channel notification rules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General Business Identity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-600" /> Platform Business &amp; GST Details
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Entity Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered GSTIN Number *</label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Support Email</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Support Helpline Phone</label>
              <input
                type="tel"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Wallet & Escrow Rules */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Wallet size={16} className="text-emerald-600" /> Wallet Rules &amp; Automated Low Balance Alert
          </h3>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Low Wallet Balance Alert Trigger (₹)
              </label>
              <input
                type="number"
                required
                value={lowWalletThreshold}
                onChange={(e) => setLowWalletThreshold(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Sends automated WhatsApp/Email alert when seller balance drops below this.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Minimum Wallet Recharge (₹)</label>
              <input
                type="number"
                required
                value={minRecharge}
                onChange={(e) => setMinRecharge(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Remittance Flat Fee (₹)</label>
              <input
                type="number"
                required
                value={remittanceFee}
                onChange={(e) => setRemittanceFee(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notification Channels */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Bell size={16} className="text-amber-600" /> Automated Multi-Channel Shippers &amp; Buyers Alerts
          </h3>

          <div className="grid gap-4 sm:grid-cols-4 text-xs">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50 cursor-pointer">
              <span className="font-semibold text-slate-800">WhatsApp Dispatch Updates</span>
              <input
                type="checkbox"
                checked={notifications.whatsapp}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, whatsapp: e.target.checked }))
                }
                className="size-4 rounded text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50 cursor-pointer">
              <span className="font-semibold text-slate-800">SMS Out-for-Delivery Alerts</span>
              <input
                type="checkbox"
                checked={notifications.sms}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, sms: e.target.checked }))
                }
                className="size-4 rounded text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50 cursor-pointer">
              <span className="font-semibold text-slate-800">Email Manifest &amp; Invoices</span>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, email: e.target.checked }))
                }
                className="size-4 rounded text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50 cursor-pointer">
              <span className="font-semibold text-slate-800">In-App Live Bell Pushes</span>
              <input
                type="checkbox"
                checked={notifications.inApp}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, inApp: e.target.checked }))
                }
                className="size-4 rounded text-indigo-600"
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-md inline-flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{loading ? "Saving System Settings…" : "Save All Platform Configurations"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

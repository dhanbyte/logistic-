"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Filter, IndianRupee, Package, Truck, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState("ORDERS");
  const [dateRange, setDateRange] = useState("THIS_MONTH");

  function handleDownloadCsv() {
    toast.success(`Exporting ${reportType} CSV report for ${dateRange}...`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Custom Reports &amp; Financial Analytics Export</h1>
        <p className="text-xs text-slate-500">
          Generate filtered Excel and CSV reports across Orders, Couriers, Wallets, and GST Invoices.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <FileSpreadsheet size={16} className="text-indigo-600" /> Export Engine Configuration
        </h3>

        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none"
            >
              <option value="ORDERS">Global Orders &amp; Dispatches Report</option>
              <option value="COD_SETTLEMENTS">COD Collections &amp; Remittance Ledger</option>
              <option value="COURIER_PERFORMANCE">Courier SLA &amp; Delivery Performance</option>
              <option value="WALLET_LEDGER">Shipper Wallet Adjustments &amp; GST Invoices</option>
              <option value="RTO_ANALYSIS">RTO &amp; NDR Analysis Report</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date Period Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none"
            >
              <option value="TODAY">Today (Live Dispatches)</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">This Current Month (August 2026)</option>
              <option value="LAST_MONTH">Previous Month (July 2026)</option>
              <option value="ALL_TIME">All-Time Cumulative</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Action</label>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer mt-0.5"
            >
              <Download size={15} />
              <span>Download Report (CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

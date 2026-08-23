"use client";

import { useState } from "react";
import { Download, FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createBulkOrders } from "@/app/ecommerce-actions";
import type { Warehouse } from "@/types";

export function BulkOrderModal({
  open,
  onClose,
  warehouses,
}: {
  open: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
}) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [csvContent, setCsvContent] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function handleDownloadSample() {
    const sampleCsv =
      "orderNumber,customerName,customerPhone,addressLine1,city,state,pincode,productName,quantity,paymentMode,orderAmount,codAmount,weightKg,lengthCm,widthCm,heightCm\n" +
      "ORD-SAMPLE-1,Aarav Sharma,9876543210,Flat 101 Lake View,Mumbai,Maharashtra,400050,Cotton Shirt,1,PREPAID,999,0,0.5,15,10,5\n" +
      "ORD-SAMPLE-2,Pooja Verma,9811223344,45 Koramangala 4th Block,Bengaluru,Karnataka,560034,Wireless Earbuds,1,COD,1999,1999,0.4,12,10,4";

    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "shopwave_bulk_orders_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!csvContent.trim()) {
      toast.error("Please select or paste CSV content.");
      return;
    }

    setLoading(true);
    const lines = csvContent.trim().split("\n");
    if (lines.length <= 1) {
      toast.error("CSV has no data rows.");
      setLoading(false);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const parsedRows = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const rowObj: any = {};
      headers.forEach((h, i) => {
        rowObj[h] = vals[i];
      });
      return rowObj;
    });

    const res = await createBulkOrders(parsedRows, warehouseId);
    setLoading(false);

    if (res.ok) {
      toast.success(`Successfully imported ${res.data?.count || parsedRows.length} orders!`);
      onClose();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <Upload size={18} />
            </span>
            <h3 className="text-base font-bold text-slate-900">Bulk CSV Order Import</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Pickup Warehouse
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.warehouseName} ({w.city} - {w.pincode})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-indigo-500 transition-colors">
            <FileText className="mx-auto size-8 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">Upload your .csv order spreadsheet</p>
            <p className="text-xs text-slate-500 mt-1">Supports up to 500 rows per batch</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Need sample CSV format?</span>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Download size={13} /> Download Template
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !csvContent}
            onClick={handleImport}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Importing…" : "Import Orders"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileText, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createBulkOrders, bulkShipOrdersAction } from "@/app/ecommerce-actions";
import type { Warehouse } from "@/types";

export function BulkOrderModal({
  open,
  warehouses,
  onClose,
}: {
  open: boolean;
  warehouses: Warehouse[];
  onClose: () => void;
}) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [autoShip, setAutoShip] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function handleDownloadSample() {
    const sampleCsv =
      "orderNumber,customerName,customerPhone,addressLine1,city,state,pincode,productName,quantity,paymentMode,orderAmount,codAmount,weightKg,lengthCm,widthCm,heightCm\n" +
      "ORD-BULK-101,Aarav Sharma,9876543210,Flat 101 Lake View Apartments,Ahmedabad,Gujarat,380006,Cotton T-Shirt,1,PREPAID,999,0,0.5,15,10,5\n" +
      "ORD-BULK-102,Pooja Verma,9811223344,45 Koramangala 4th Block,Bengaluru,Karnataka,560034,Wireless Earbuds,1,COD,1999,1999,0.4,12,10,4\n" +
      "ORD-BULK-103,Rohan Mehta,9988776655,Plot 22 MG Road,Mumbai,Maharashtra,400050,Leather Wallet,2,PREPAID,1499,0,0.3,10,10,3";

    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "freightflow_bulk_orders_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);

      // Parse preview
      const lines = content.trim().split("\n");
      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h) => h.trim());
        const preview = lines.slice(1, 6).map((line) => {
          const vals = line.split(",").map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = vals[i];
          });
          return obj;
        });
        setPreviewRows(preview);
      }
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!csvContent.trim()) {
      toast.error("Please select a CSV file.");
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

    if (res.ok) {
      const orderIds = res.data?.orderIds || [];
      if (autoShip && orderIds.length > 0) {
        toast.info(`Auto-generating live AWBs for ${orderIds.length} imported orders…`);
        const shipRes = await bulkShipOrdersAction(orderIds, "shadowfax");
        toast.success(shipRes.message || `Successfully imported and shipped ${orderIds.length} orders!`);
      } else {
        toast.success(`Successfully imported ${res.data?.count || parsedRows.length} orders!`);
      }
      setLoading(false);
      onClose();
    } else {
      setLoading(false);
      toast.error(res.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <Upload size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bulk CSV Order Import</h3>
              <p className="text-xs text-slate-500">Upload bulk orders and optionally auto-generate live AWBs.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Pickup Origin Warehouse
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium focus:border-indigo-600 focus:outline-none"
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
            <p className="text-sm font-semibold text-slate-800">
              {fileName ? fileName : "Upload your .csv order spreadsheet"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Supports up to 500 rows per batch</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Spreadsheet Preview (First {previewRows.length} rows)</span>
                <span className="text-emerald-700 font-normal flex items-center gap-1">
                  <CheckCircle2 size={12} /> Format Validated
                </span>
              </div>
              <div className="overflow-x-auto max-h-36">
                <table className="w-full text-left text-[10px]">
                  <thead className="border-b border-slate-200 bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2">Order #</th>
                      <th className="p-2">Customer</th>
                      <th className="p-2">Pincode</th>
                      <th className="p-2">Weight</th>
                      <th className="p-2">Payment</th>
                      <th className="p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-white">
                        <td className="p-2 font-mono font-bold text-indigo-600">{r.orderNumber}</td>
                        <td className="p-2">{r.customerName}</td>
                        <td className="p-2 font-mono">{r.pincode}</td>
                        <td className="p-2">{r.weightKg} kg</td>
                        <td className="p-2 font-bold">{r.paymentMode}</td>
                        <td className="p-2 font-bold">₹{r.orderAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Auto Ship Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Instant Bulk Shipping</p>
                <p className="text-[11px] text-slate-500">
                  Automatically assign courier &amp; generate live AWBs upon import.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoShip}
                onChange={(e) => setAutoShip(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Need standard CSV format?</span>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Download size={13} /> Download Sample Template
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !csvContent}
            onClick={handleImport}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading
              ? autoShip
                ? "Importing & Shipping…"
                : "Importing…"
              : autoShip
                ? "Import & Ship Now"
                : "Import Orders"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckSquare,
  Download,
  FileText,
  Printer,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  bulkCancelOrdersAction,
  bulkDeleteOrdersAction,
  bulkShipOrdersAction,
} from "@/app/ecommerce-actions";
import { ConfirmDialog } from "./confirm-dialog";
import type { Order } from "@/types";

export function BulkActionBar({
  selectedOrders,
  onClearSelection,
}: {
  selectedOrders: Order[];
  onClearSelection: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    tone: "danger" | "warning" | "primary";
    label: string;
  }>({
    open: false,
    title: "",
    description: "",
    action: async () => {},
    tone: "danger",
    label: "Confirm",
  });

  if (!selectedOrders.length) return null;

  const count = selectedOrders.length;
  const unmanifested = selectedOrders.filter(
    (o) => !o.shipment && ["READY_TO_SHIP", "DRAFT"].includes(o.orderStatus),
  );
  const manifested = selectedOrders.filter(
    (o) => o.shipment || ["PENDING_PICKUP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.orderStatus),
  );

  // 1. Bulk Ship Action
  async function handleBulkShip() {
    if (!unmanifested.length) {
      toast.error("None of the selected orders are ready for shipping.");
      return;
    }

    setLoading(true);
    toast.info(`Generating AWBs for ${unmanifested.length} orders…`);
    const res = await bulkShipOrdersAction(
      unmanifested.map((o) => o.id),
      "shadowfax",
    );
    setLoading(false);

    if (res.ok) {
      toast.success(res.message);
      onClearSelection();
    } else {
      toast.error(res.message);
    }
  }

  // 2. Bulk Print Labels
  function handleBulkPrintLabels() {
    const ids = selectedOrders
      .map((o) => o.shipment?.id || o.id)
      .filter(Boolean);

    if (!ids.length) {
      toast.error("No shipments selected for label printing.");
      return;
    }

    window.open(`/shipments/bulk-labels?ids=${ids.join(",")}`, "_blank");
    toast.success(`Opening 4x6 thermal labels for ${ids.length} orders.`);
  }

  // 3. Generate Manifest for Selection
  function handleGenerateManifest() {
    window.open("/manifest", "_blank");
  }

  // 4. Export Selected to CSV
  function handleExportCsv() {
    const headers = [
      "Order ID",
      "Channel",
      "Order Date",
      "Customer Name",
      "Phone",
      "Address",
      "City",
      "State",
      "Pincode",
      "Product Item",
      "Qty",
      "SKU",
      "Weight (kg)",
      "Payment Mode",
      "Order Amount (INR)",
      "COD Amount (INR)",
      "Status",
      "AWB Number",
      "Courier",
    ];

    const rows = selectedOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.channelName}"`,
      `"${o.createdAt.slice(0, 10)}"`,
      `"${o.customer?.fullName || ""}"`,
      `"${o.customer?.phone || ""}"`,
      `"${o.customer?.addressLine1 || ""}"`,
      `"${o.customer?.city || ""}"`,
      `"${o.customer?.state || ""}"`,
      `"${o.customer?.pincode || ""}"`,
      `"${o.items?.[0]?.productName || ""}"`,
      o.items?.[0]?.quantity || 1,
      `"${o.items?.[0]?.sku || ""}"`,
      o.totalWeightKg || 0.5,
      `"${o.paymentMode}"`,
      o.orderAmount || 0,
      o.codAmount || 0,
      `"${o.orderStatus}"`,
      `"${o.shipment?.awbNumber || ""}"`,
      `"${o.shipment?.courierProvider?.name || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${count} orders to CSV.`);
  }

  // 5. Bulk Cancel
  function triggerBulkCancel() {
    setConfirmDialog({
      open: true,
      title: `Cancel ${count} Selected Orders?`,
      description:
        "Are you sure you want to mark these orders as Cancelled? This action can be reviewed in the Cancelled orders tab.",
      tone: "warning",
      label: "Cancel Orders",
      action: async () => {
        setLoading(true);
        const res = await bulkCancelOrdersAction(selectedOrders.map((o) => o.id));
        setLoading(false);
        if (res.ok) {
          toast.success(res.message);
          onClearSelection();
        } else {
          toast.error(res.message);
        }
      },
    });
  }

  // 6. Bulk Delete
  function triggerBulkDelete() {
    setConfirmDialog({
      open: true,
      title: `Permanently Delete ${count} Orders?`,
      description:
        "WARNING: This will permanently remove the selected orders and items from your database. This action cannot be undone.",
      tone: "danger",
      label: "Delete Permanently",
      action: async () => {
        setLoading(true);
        const res = await bulkDeleteOrdersAction(selectedOrders.map((o) => o.id));
        setLoading(false);
        if (res.ok) {
          toast.success(res.message);
          onClearSelection();
        } else {
          toast.error(res.message);
        }
      },
    });
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-white shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {count}
          </span>
          <span className="text-xs font-bold text-slate-200">Selected</span>
        </div>

        <div className="flex items-center gap-2">
          {unmanifested.length > 0 && (
            <button
              type="button"
              disabled={loading}
              onClick={handleBulkShip}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Truck size={13} />
              <span>Bulk Ship ({unmanifested.length})</span>
            </button>
          )}

          {manifested.length > 0 && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={handleBulkPrintLabels}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Labels</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleGenerateManifest}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                <FileText size={13} />
                <span>Manifest</span>
              </button>
            </>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={triggerBulkCancel}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:bg-slate-700 cursor-pointer"
            title="Cancel selected orders"
          >
            <AlertTriangle size={13} />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={triggerBulkDelete}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-slate-700 cursor-pointer"
            title="Delete selected orders"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          title="Deselect all"
        >
          <X size={16} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.label}
        confirmTone={confirmDialog.tone}
        loading={loading}
        onConfirm={async () => {
          await confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}

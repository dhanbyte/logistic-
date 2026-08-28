"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  Truck,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/calculations";
import { cancelOrderAction, cloneOrderAction, deleteOrderAction } from "@/app/ecommerce-actions";
import type { Order, Warehouse } from "@/types";
import type { OrderStatusCounts } from "@/lib/data/orders";
import { BulkActionBar } from "./bulk-action-bar";
import { BulkOrderModal } from "./bulk-order-modal";
import { ConfirmDialog } from "./confirm-dialog";
import { EditOrderModal } from "./edit-order-modal";
import { ShipNowModal } from "./ship-now-modal";

export function OrdersTable({
  orders,
  total,
  page,
  pageCount,
  counts,
  warehouses,
}: {
  orders: Order[];
  total: number;
  page: number;
  pageCount: number;
  counts?: OrderStatusCounts;
  warehouses: Warehouse[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrderForShip, setSelectedOrderForShip] = useState<Order | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [actionLoading, setActionLoading] = useState(false);

  // Single Action Confirm Dialog
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    tone: "danger" | "warning" | "primary";
    label: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    tone: "danger",
    label: "Confirm",
    onConfirm: async () => {},
  });

  const currentStatus = searchParams.get("status") || "ALL";

  function updateQuery(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/orders?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery("q", searchTerm);
  }

  // Checkbox handlers
  const allCurrentIds = orders.map((o) => o.id);
  const isAllSelected = allCurrentIds.length > 0 && allCurrentIds.every((id) => selectedOrderIds.includes(id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(allCurrentIds);
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  const selectedOrdersList = orders.filter((o) => selectedOrderIds.includes(o.id));

  // Single Cancel
  function handleSingleCancel(order: Order) {
    setConfirmState({
      open: true,
      title: `Cancel Order ${order.orderNumber}?`,
      description: "This will mark the order as Cancelled and remove it from active shipping queues.",
      tone: "warning",
      label: "Cancel Order",
      onConfirm: async () => {
        setActionLoading(true);
        const res = await cancelOrderAction(order.id);
        setActionLoading(false);
        if (res.ok) {
          toast.success(`Order ${order.orderNumber} cancelled.`);
        } else {
          toast.error(res.message);
        }
      },
    });
  }

  // Single Delete
  function handleSingleDelete(order: Order) {
    setConfirmState({
      open: true,
      title: `Delete Order ${order.orderNumber}?`,
      description: "Permanently delete this order record and items from your account. This action cannot be undone.",
      tone: "danger",
      label: "Delete Order",
      onConfirm: async () => {
        setActionLoading(true);
        const res = await deleteOrderAction(order.id);
        setActionLoading(false);
        if (res.ok) {
          toast.success(`Order ${order.orderNumber} deleted.`);
        } else {
          toast.error(res.message);
        }
      },
    });
  }

  // Single Clone / Re-Ship
  async function handleCloneOrder(order: Order) {
    setActionLoading(true);
    toast.info(`Cloning order ${order.orderNumber}…`);
    const res = await cloneOrderAction(order.id);
    setActionLoading(false);
    if (res.ok) {
      toast.success(res.message || `Order ${order.orderNumber} cloned successfully!`);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  // Export Filtered View to CSV
  function handleExportAllFiltered() {
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
      "Item Name",
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

    const rows = orders.map((o) => [
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
    link.setAttribute("download", `orders_filtered_${currentStatus}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${orders.length} orders to CSV.`);
  }

  const tabs = [
    { key: "ALL", label: "All Orders", count: counts?.all ?? total, icon: Package },
    { key: "TO_SHIP", label: "To Ship / New", count: counts?.toShip ?? 0, icon: Clock },
    { key: "MANIFESTED", label: "Manifested / Ready for Pickup", count: counts?.manifested ?? 0, icon: FileText },
    { key: "IN_TRANSIT", label: "In Transit", count: counts?.inTransit ?? 0, icon: Truck },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery (OFD)", count: counts?.ofd ?? 0, icon: MapPin },
    { key: "DELIVERED", label: "Delivered", count: counts?.delivered ?? 0, icon: CheckCircle2 },
    { key: "NDR", label: "NDR Exceptions", count: counts?.ndr ?? 0, icon: AlertTriangle },
    { key: "RTO", label: "RTO", count: counts?.rto ?? 0, icon: RotateCcw },
    { key: "CANCELLED", label: "Cancelled", count: counts?.cancelled ?? 0, icon: XCircle },
  ];

  return (
    <div className="space-y-4">
      {/* Status Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map((tab) => {
          const isActive = currentStatus === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => updateQuery("status", tab.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={14} className={isActive ? "text-white" : "text-slate-400"} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, Customer, Phone or SKU…"
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Mode Filter */}
          <select
            value={searchParams.get("paymentMode") || "ALL"}
            onChange={(e) => updateQuery("paymentMode", e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Payments</option>
            <option value="PREPAID">Prepaid</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>

          {/* Channel Filter */}
          <select
            value={searchParams.get("channel") || "ALL"}
            onChange={(e) => updateQuery("channel", e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Channels</option>
            <option value="MANUAL">Manual</option>
            <option value="SHOPIFY">Shopify</option>
            <option value="WOOCOMMERCE">WooCommerce</option>
          </select>

          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            title="Import orders in bulk via CSV"
          >
            <Upload size={14} className="text-indigo-600" /> Bulk CSV
          </button>

          <Link
            href="/manifest"
            target="_blank"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            title="Open Courier Handover Manifest"
          >
            <FileText size={14} className="text-indigo-600" /> Manifest
          </Link>

          <button
            type="button"
            onClick={handleExportAllFiltered}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            title="Export filtered list to CSV"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Order Details</th>
                <th className="py-3 px-4">Customer & Destination</th>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status & AWB</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {orders.map((order) => {
                const isSelected = selectedOrderIds.includes(order.id);
                const hasShipment = Boolean(order.shipment || ["PENDING_PICKUP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "NDR", "RTO_INITIATED"].includes(order.orderStatus));
                const shipmentAwb = order.shipment?.awbNumber;
                const courierName = order.shipment?.courierProvider?.name || (shipmentAwb?.startsWith("SF") ? "Shadowfax" : shipmentAwb ? "Xpressbees" : null);
                const isManifested = order.orderStatus === "PENDING_PICKUP" || Boolean(order.shipment && order.shipment.shipmentStatus === "MANIFESTED");
                const isDraftOrToShip = order.orderStatus === "READY_TO_SHIP" || order.orderStatus === "DRAFT";

                return (
                  <tr
                    key={order.id}
                    className={`transition-colors ${
                      isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50/70"
                    }`}
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(order.id)}
                        className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-bold text-sm text-indigo-600 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="rounded-sm bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                          {order.channelName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {order.createdAt.slice(0, 10)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{order.customer?.fullName}</p>
                      <p className="text-[11px] text-slate-500">
                        {order.customer?.city}, {order.customer?.state} -{" "}
                        <strong className="text-slate-700">{order.customer?.pincode}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">{order.customer?.phone}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800 line-clamp-1">
                        {order.items?.[0]?.productName || "Product"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Qty: {order.items?.[0]?.quantity || 1} &bull; SKU:{" "}
                        {order.items?.[0]?.sku || "N/A"}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{order.totalWeightKg} kg</p>
                      <p className="text-[11px] text-slate-400">
                        {order.lengthCm}x{order.widthCm}x{order.heightCm} cm
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{formatINR(order.orderAmount)}</p>
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          order.paymentMode === "COD"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {order.paymentMode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          order.orderStatus === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.orderStatus === "OUT_FOR_DELIVERY"
                              ? "bg-blue-100 text-blue-800"
                              : order.orderStatus === "NDR"
                                ? "bg-rose-100 text-rose-800"
                                : order.orderStatus === "RTO_INITIATED" || order.orderStatus === "RTO_DELIVERED"
                                  ? "bg-orange-100 text-orange-800"
                                  : order.orderStatus === "CANCELLED"
                                    ? "bg-rose-100 text-rose-800"
                                    : order.orderStatus === "IN_TRANSIT"
                                      ? "bg-amber-100 text-amber-800"
                                      : isManifested
                                        ? "bg-indigo-100 text-indigo-800"
                                        : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isManifested
                          ? "MANIFESTED (PICKUP PENDING)"
                          : isDraftOrToShip
                            ? "TO SHIP (PENDING AWB)"
                            : order.orderStatus.replace(/_/g, " ")}
                      </span>

                      {shipmentAwb && (
                        <div className="mt-1 flex items-center gap-1 text-[11px]">
                          <Link
                            href={`/track/${shipmentAwb}`}
                            target="_blank"
                            className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                            title="Open Public Tracking Page"
                          >
                            {shipmentAwb}
                          </Link>
                          {courierName && (
                            <span className="text-[10px] text-slate-400">({courierName})</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.orderStatus === "CANCELLED" ? (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleCloneOrder(order)}
                              className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Clone and re-ship this cancelled order"
                            >
                              <Copy size={12} className="text-indigo-600" />
                              <span>Clone / Re-Ship</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSingleDelete(order)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                              title="Delete order permanently"
                            >
                              <Trash2 size={14} />
                            </button>

                            <Link
                              href={`/orders/${order.id}`}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              title="View order details"
                            >
                              <Eye size={14} />
                            </Link>
                          </>
                        ) : !hasShipment ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForShip(order)}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Truck size={13} /> Ship Now
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedOrderForEdit(order)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                              title="Edit order details"
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleCloneOrder(order)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                              title="Clone order"
                            >
                              <Copy size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSingleCancel(order)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
                              title="Cancel order"
                            >
                              <XCircle size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSingleDelete(order)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                              title="Delete draft order"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={shipmentAwb ? `/track/${shipmentAwb}` : `/shipments/${order.shipment?.id || order.id}`}
                              target={shipmentAwb ? "_blank" : undefined}
                              className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                              title="Track Live Shipment"
                            >
                              <Truck size={12} /> Track
                            </Link>

                            {order.shipment?.labelUrl && (
                              <a
                                href={order.shipment.labelUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                title="Print Official Shipping Label"
                              >
                                <Printer size={13} />
                              </a>
                            )}

                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleCloneOrder(order)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                              title="Clone and Re-Ship order"
                            >
                              <Copy size={13} />
                            </button>

                            <Link
                              href={`/orders/${order.id}`}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              title="View order details"
                            >
                              <Eye size={14} />
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!orders.length && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Package className="mx-auto size-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">No customer orders found in this view</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Create your first single order or upload bulk CSV spreadsheet.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing {(page - 1) * Number(searchParams.get("pageSize") || 10) + 1} to{" "}
              {Math.min(page * Number(searchParams.get("pageSize") || 10), total)} of {total} orders
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={searchParams.get("pageSize") || "10"}
                  onChange={(e) => updateQuery("pageSize", e.target.value)}
                  className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => updateQuery("page", String(page - 1))}
                  className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-medium text-slate-700">
                  Page {page} of {pageCount}
                </span>
                <button
                  disabled={page >= pageCount}
                  onClick={() => updateQuery("page", String(page + 1))}
                  className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Multi-Select Bulk Action Dock */}
      <BulkActionBar
        selectedOrders={selectedOrdersList}
        onClearSelection={() => setSelectedOrderIds([])}
      />

      {/* Modals */}
      <ShipNowModal
        order={selectedOrderForShip}
        open={!!selectedOrderForShip}
        onClose={() => setSelectedOrderForShip(null)}
      />

      <EditOrderModal
        order={selectedOrderForEdit}
        open={!!selectedOrderForEdit}
        onClose={() => setSelectedOrderForEdit(null)}
      />

      <BulkOrderModal
        open={showBulkModal}
        warehouses={warehouses}
        onClose={() => setShowBulkModal(false)}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.label}
        confirmTone={confirmState.tone}
        loading={actionLoading}
        onConfirm={async () => {
          await confirmState.onConfirm();
          setConfirmState((prev) => ({ ...prev, open: false }));
        }}
        onClose={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Package,
  Search,
  Truck,
  Upload,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import type { Order, Warehouse } from "@/types";
import { BulkOrderModal } from "./bulk-order-modal";
import { ShipNowModal } from "./ship-now-modal";

export function OrdersTable({
  orders,
  total,
  page,
  pageCount,
  warehouses,
}: {
  orders: Order[];
  total: number;
  page: number;
  pageCount: number;
  warehouses: Warehouse[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedOrderForShip, setSelectedOrderForShip] = useState<Order | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  function updateQuery(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery("q", searchTerm);
  }

  return (
    <div className="space-y-4">
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
          {/* Status Filter */}
          <select
            value={searchParams.get("status") || "ALL"}
            onChange={(e) => updateQuery("status", e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY_TO_SHIP">Ready to Ship</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="NDR">NDR</option>
            <option value="RTO_INITIATED">RTO</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

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
            onClick={() => setShowBulkModal(true)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Upload size={14} /> Bulk CSV
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Order Details</th>
                <th className="py-3 px-4">Customer & Destination</th>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {orders.map((order) => {
                const isReady = order.orderStatus === "READY_TO_SHIP" || order.orderStatus === "DRAFT";
                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
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
                                : order.orderStatus === "RTO_INITIATED"
                                  ? "bg-orange-100 text-orange-800"
                                  : order.orderStatus === "IN_TRANSIT"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {order.orderStatus.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isReady && (
                          <button
                            onClick={() => setSelectedOrderForShip(order)}
                            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs flex items-center gap-1"
                          >
                            <Truck size={13} /> Ship Now
                          </button>
                        )}
                        <Link
                          href={`/orders/${order.id}`}
                          className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          title="View order"
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!orders.length && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="mx-auto size-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">No customer orders found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Create your first single order or upload bulk CSV.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} orders
            </span>
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
        )}
      </div>

      {/* Modals */}
      <ShipNowModal
        order={selectedOrderForShip}
        open={!!selectedOrderForShip}
        onClose={() => setSelectedOrderForShip(null)}
      />

      <BulkOrderModal
        open={showBulkModal}
        warehouses={warehouses}
        onClose={() => setShowBulkModal(false)}
      />
    </div>
  );
}

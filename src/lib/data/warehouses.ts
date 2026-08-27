import { mockWarehouses } from "@/data/mock-data";
import { getEffectiveSession } from "@/lib/supabase/server";
import type { Warehouse } from "@/types";

export interface WarehouseRealShipment {
  awb: string;
  orderNumber: string;
  recipient: string;
  destination: string;
  courier: string;
  status: "READY_FOR_PICKUP" | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "NDR" | "CANCELLED";
  statusText: string;
  statusColor: string;
  items: string;
  weight: string;
  amount: string;
  timestamp: string;
}

export interface WarehouseWithStats extends Warehouse {
  awaitingPickupCount: number;
  inTransitCount: number;
  deliveredCount: number;
  totalOrdersCount: number;
  realShipments: WarehouseRealShipment[];
}

export interface WarehousesPageData {
  warehouses: WarehouseWithStats[];
  totalHubs: number;
  totalAwaitingPickup: number;
  totalInTransit: number;
  totalDelivered: number;
  pickupSuccessSla: string;
  activeCouriers: string[];
}

export async function getWarehouses(): Promise<Warehouse[]> {
  const session = await getEffectiveSession();
  if (!session) {
    return [];
  }

  const { supabase, user } = session;

  const { data, error } = await supabase
    .from("warehouses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return [];
  }


  return data.map((w: any) => ({
    id: w.id,
    userId: w.user_id,
    warehouseName: w.warehouse_name,
    contactPerson: w.contact_person,
    contactPhone: w.contact_phone,
    contactEmail: w.contact_email,
    addressLine1: w.address_line1,
    addressLine2: w.address_line2,
    city: w.city,
    state: w.state,
    pincode: w.pincode,
    gstin: w.gstin,
    isDefault: w.is_default,
    isActive: w.is_active,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  }));
}

export async function getDefaultWarehouse(): Promise<Warehouse | null> {
  const warehouses = await getWarehouses();
  return warehouses.find((w) => w.isDefault) ?? warehouses[0] ?? null;
}

/**
 * Fetch real warehouses with real database telemetry & shipments
 */
export async function getWarehousesPageData(): Promise<WarehousesPageData> {
  const baseWarehouses = await getWarehouses();
  const session = await getEffectiveSession();

  if (!session || baseWarehouses.length === 0) {
    return {
      warehouses: baseWarehouses.map((w) => ({
        ...w,
        awaitingPickupCount: 0,
        inTransitCount: 0,
        deliveredCount: 0,
        totalOrdersCount: 0,
        realShipments: [],
      })),
      totalHubs: baseWarehouses.length,
      totalAwaitingPickup: 0,
      totalInTransit: 0,
      totalDelivered: 0,
      pickupSuccessSla: "100%",
      activeCouriers: ["Shadowfax"],
    };
  }

  const { supabase, user } = session;

  // 1. Fetch real orders for this user with relationships
  const { data: rawOrders } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      order_status,
      warehouse_id,
      payment_mode,
      order_amount,
      cod_amount,
      chargeable_weight_kg,
      created_at,
      customer:customers(full_name, city, state, pincode),
      items:order_items(product_name, quantity),
      shipments:ecommerce_shipments(
        id,
        awb_number,
        shipment_status,
        courier_provider:courier_providers(name, code),
        pickup_scheduled_date,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = rawOrders || [];

  let globalAwaitingPickup = 0;
  let globalInTransit = 0;
  let globalDelivered = 0;
  const couriersSet = new Set<string>();

  const warehousesWithStats: WarehouseWithStats[] = baseWarehouses.map((wh) => {
    // Filter orders belonging to this warehouse
    const whOrders = orders.filter((o: any) => o.warehouse_id === wh.id);

    let awaitingPickup = 0;
    let inTransit = 0;
    let delivered = 0;
    const realShipments: WarehouseRealShipment[] = [];

    for (const ord of whOrders) {
      const shp = (ord.shipments && ord.shipments.length > 0) ? ord.shipments[0] : null;
      const courierName = shp?.courier_provider?.name || "Direct Linehaul";
      if (shp?.courier_provider?.name) {
        couriersSet.add(shp.courier_provider.name);
      }

      const status = ord.order_status;
      const shpStatus = shp?.shipment_status;

      let normalizedStatus: WarehouseRealShipment["status"] = "READY_FOR_PICKUP";
      let statusText = "Ready for Courier Rider Pickup";
      let statusColor = "bg-amber-50 text-amber-800 border-amber-200";

      if (shpStatus === "DELIVERED" || status === "DELIVERED") {
        normalizedStatus = "DELIVERED";
        statusText = "Delivered & Signed";
        statusColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
        delivered++;
      } else if (
        shpStatus === "IN_TRANSIT" ||
        shpStatus === "OUT_FOR_DELIVERY" ||
        status === "IN_TRANSIT" ||
        status === "OUT_FOR_DELIVERY"
      ) {
        normalizedStatus = shpStatus === "OUT_FOR_DELIVERY" ? "OUT_FOR_DELIVERY" : "IN_TRANSIT";
        statusText = normalizedStatus === "OUT_FOR_DELIVERY" ? "Out for Delivery" : "In Transit to Hub";
        statusColor = "bg-blue-50 text-blue-800 border-blue-200";
        inTransit++;
      } else if (shpStatus === "NDR" || status === "NDR") {
        normalizedStatus = "NDR";
        statusText = "NDR Pending Action";
        statusColor = "bg-rose-50 text-rose-800 border-rose-200";
      } else if (status === "CANCELLED") {
        normalizedStatus = "CANCELLED";
        statusText = "Order Cancelled";
        statusColor = "bg-slate-100 text-slate-700 border-slate-200";
      } else {
        // READY_TO_SHIP or MANIFESTED
        normalizedStatus = "READY_FOR_PICKUP";
        statusText = shp ? "Manifested & Awaiting Rider" : "Label Generated (Ready for Pickup)";
        statusColor = "bg-amber-50 text-amber-800 border-amber-200";
        awaitingPickup++;
      }

      const itemsSummary =
        ord.items && ord.items.length > 0
          ? `${ord.items[0].quantity}x ${ord.items[0].product_name}${ord.items.length > 1 ? ` +${ord.items.length - 1} more` : ""}`
          : "1x Standard Parcel";

      const destinationStr = ord.customer
        ? `${ord.customer.city || "Destination"}, ${ord.customer.state || ""} (${ord.customer.pincode || "400001"})`
        : "PIN: 400001";

      const createdDate = ord.created_at ? new Date(ord.created_at) : new Date();
      const timeFormatted = createdDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      realShipments.push({
        awb: shp?.awb_number || `AWB-PENDING-${ord.order_number}`,
        orderNumber: ord.order_number,
        recipient: ord.customer?.full_name || "Customer",
        destination: destinationStr,
        courier: courierName,
        status: normalizedStatus,
        statusText,
        statusColor,
        items: itemsSummary,
        weight: `${ord.chargeable_weight_kg || 0.5} kg`,
        amount: `₹${(ord.payment_mode === "COD" ? ord.cod_amount : ord.order_amount) || 0} (${ord.payment_mode || "Prepaid"})`,
        timestamp: timeFormatted,
      });
    }

    globalAwaitingPickup += awaitingPickup;
    globalInTransit += inTransit;
    globalDelivered += delivered;

    return {
      ...wh,
      awaitingPickupCount: awaitingPickup,
      inTransitCount: inTransit,
      deliveredCount: delivered,
      totalOrdersCount: whOrders.length,
      realShipments,
    };
  });

  const totalDispatched = globalInTransit + globalDelivered;
  const slaPercentage = totalDispatched > 0
    ? ((globalDelivered + globalInTransit) / totalDispatched * 100).toFixed(1)
    : "100.0";

  return {
    warehouses: warehousesWithStats,
    totalHubs: baseWarehouses.length,
    totalAwaitingPickup: globalAwaitingPickup,
    totalInTransit: globalInTransit,
    totalDelivered: globalDelivered,
    pickupSuccessSla: `${slaPercentage}%`,
    activeCouriers: couriersSet.size > 0 ? Array.from(couriersSet) : ["Shadowfax"],
  };
}

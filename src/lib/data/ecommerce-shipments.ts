import {
  mockEcommerceKpis,
  mockEcommerceShipments,
  mockNdrCases,
  mockRtoShipments,
} from "@/data/mock-data";
import { getEffectiveSession } from "@/lib/supabase/server";
import type {
  EcommerceShipment,
  NdrCase,
  RtoShipment,
  TrackingEvent,
} from "@/types";

export type ShipmentQuery = {
  q?: string;
  status?: string;
  courier?: string;
  paymentMode?: string;
  page?: number;
  pageSize?: number;
};

export interface EcommerceShipmentsQueryResult {
  shipments: EcommerceShipment[];
  total: number;
  page: number;
  pageCount: number;
  isDemo: boolean;
}

export async function getEcommerceShipments(
  query?: ShipmentQuery,
): Promise<EcommerceShipmentsQueryResult> {
  const page = Math.max(1, Number(query?.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(query?.pageSize) || 10));
  const searchTerm = (query?.q ?? "").toLowerCase().trim();
  const statusFilter = query?.status ?? "ALL";
  const courierFilter = query?.courier ?? "ALL";
  const paymentFilter = query?.paymentMode ?? "ALL";

  const session = await getEffectiveSession();
  if (!session) {
    let filtered = [...mockEcommerceShipments];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.awbNumber.toLowerCase().includes(searchTerm) ||
          (s.order?.orderNumber ?? "").toLowerCase().includes(searchTerm) ||
          (s.order?.customer?.fullName ?? "").toLowerCase().includes(searchTerm) ||
          s.deliveryPincode.includes(searchTerm),
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((s) => s.shipmentStatus === statusFilter);
    }

    if (courierFilter !== "ALL") {
      filtered = filtered.filter(
        (s) => (s.courierProvider?.code ?? "").toLowerCase() === courierFilter.toLowerCase(),
      );
    }

    if (paymentFilter !== "ALL") {
      filtered = filtered.filter((s) => s.paymentMode === paymentFilter);
    }

    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      shipments: items,
      total,
      page,
      pageCount,
      isDemo: true,
    };
  }

  const { supabase, user } = session;

  let dbQuery = supabase
    .from("ecommerce_shipments")
    .select(
      "*, order:orders(*, customer:customers(*)), warehouse:warehouses(*), courier_provider:courier_providers(*)",
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (searchTerm) {
    dbQuery = dbQuery.or(
      `awb_number.ilike.%${searchTerm}%,tracking_number.ilike.%${searchTerm}%,delivery_pincode.ilike.%${searchTerm}%`,
    );
  }

  if (statusFilter !== "ALL") {
    dbQuery = dbQuery.eq("shipment_status", statusFilter as any);
  }

  if (courierFilter !== "ALL") {
    // If courier filter is active, filter by courier provider code or ID
    dbQuery = dbQuery.ilike("courier_provider.code", `%${courierFilter}%`);
  }

  if (paymentFilter !== "ALL") {
    dbQuery = dbQuery.eq("payment_mode", paymentFilter as any);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await dbQuery.range(from, to);

  if (error || !data) {
    console.error("[getEcommerceShipments.error]", error);
    return {
      shipments: [],
      total: 0,
      page: 1,
      pageCount: 1,
      isDemo: false,
    };
  }

  const mapped: EcommerceShipment[] = data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    orderId: row.order_id,
    order: row.order
      ? {
          id: row.order.id,
          userId: row.order.user_id,
          orderNumber: row.order.order_number,
          channelOrderId: row.order.channel_order_id,
          channelName: row.order.channel_name,
          customerId: row.order.customer_id,
          customer: row.order.customer,
          warehouseId: row.order.warehouse_id,
          paymentMode: row.order.payment_mode,
          orderAmount: Number(row.order.order_amount),
          codAmount: Number(row.order.cod_amount),
          orderStatus: row.order.order_status,
          totalWeightKg: Number(row.order.total_weight_kg),
          lengthCm: Number(row.order.length_cm),
          widthCm: Number(row.order.width_cm),
          heightCm: Number(row.order.height_cm),
          volumetricWeightKg: Number(row.order.volumetric_weight_kg),
          chargeableWeightKg: Number(row.order.chargeable_weight_kg),
          invoiceNumber: row.order.invoice_number,
          invoiceDate: row.order.invoice_date,
          createdAt: row.order.created_at,
          updatedAt: row.order.updated_at,
        }
      : undefined,
    warehouseId: row.warehouse_id,
    warehouse: row.warehouse,
    courierProviderId: row.courier_provider_id,
    courierProvider: row.courier_provider
      ? {
          id: row.courier_provider.id,
          code: row.courier_provider.code,
          name: row.courier_provider.name,
          isActive: row.courier_provider.is_active,
          supportsCod: row.courier_provider.supports_cod,
          supportsPrepaid: row.courier_provider.supports_prepaid,
          supportsReversePickup: row.courier_provider.supports_reverse_pickup,
          trackingUrlTemplate: row.courier_provider.tracking_url_template,
          logoUrl: row.courier_provider.logo_url,
          createdAt: row.courier_provider.created_at,
          updatedAt: row.courier_provider.updated_at,
        }
      : undefined,
    courierAccountId: row.courier_account_id,
    awbNumber: row.awb_number,
    trackingNumber: row.tracking_number,
    shipmentStatus: row.shipment_status,
    pickupPincode: row.pickup_pincode,
    deliveryPincode: row.delivery_pincode,
    paymentMode: row.payment_mode,
    codAmount: Number(row.cod_amount),
    declaredValue: Number(row.declared_value),
    weightKg: Number(row.weight_kg),
    lengthCm: Number(row.length_cm),
    widthCm: Number(row.width_cm),
    heightCm: Number(row.height_cm),
    volumetricWeightKg: Number(row.volumetric_weight_kg),
    chargeableWeightKg: Number(row.chargeable_weight_kg),
    shippingCharge: Number(row.shipping_charge),
    courierCharge: Number(row.courier_charge),
    sellerMargin: Number(row.seller_margin),
    pickupScheduledDate: row.pickup_scheduled_date,
    estimatedDeliveryDate: row.estimated_delivery_date,
    actualDeliveryDate: row.actual_delivery_date,
    labelUrl: row.label_url,
    manifestUrl: row.manifest_url,
    routingCode: row.routing_code,
    trackingUrl: row.tracking_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    shipments: mapped,
    total: count ?? mapped.length,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? mapped.length) / pageSize)),
    isDemo: false,
  };
}

export async function getEcommerceShipmentById(
  shipmentId: string,
): Promise<{
  shipment: EcommerceShipment | null;
  trackingEvents: TrackingEvent[];
  ndrCase: NdrCase | null;
  rtoShipment: RtoShipment | null;
}> {
  const session = await getEffectiveSession();
  if (!session) {
    const shipment = mockEcommerceShipments.find((s) => s.id === shipmentId) ?? mockEcommerceShipments[0];
    const ndr = mockNdrCases.find((n) => n.shipmentId === shipment.id) ?? null;
    const rto = mockRtoShipments.find((r) => r.originalShipmentId === shipment.id) ?? null;

    return {
      shipment,
      trackingEvents: [],
      ndrCase: ndr,
      rtoShipment: rto,
    };
  }

  const { supabase, user } = session;

  let query = supabase
    .from("ecommerce_shipments")
    .select(
      "*, order:orders(*, customer:customers(*), items:order_items(*)), warehouse:warehouses(*), courier_provider:courier_providers(*)",
    )
    .eq("user_id", user.id);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shipmentId);
  if (isUuid) {
    query = query.or(`id.eq.${shipmentId},order_id.eq.${shipmentId}`);
  } else {
    query = query.or(`awb_number.eq.${shipmentId},id.eq.${shipmentId}`);
  }

  const { data: rows, error } = await query.limit(1);
  const row = rows?.[0];

  if (error || !row) {
    const fallback =
      mockEcommerceShipments.find(
        (s) => s.id === shipmentId || s.awbNumber === shipmentId || s.orderId === shipmentId,
      ) ?? null;
    return {
      shipment: fallback,
      trackingEvents: [],
      ndrCase: null,
      rtoShipment: null,
    };
  }

  const [eventsResult, ndrResult, rtoResult] = await Promise.all([
    supabase
      .from("tracking_events")
      .select("*")
      .eq("shipment_id", row.id)
      .order("scan_datetime", { ascending: false }),
    supabase.from("ndr_cases").select("*").eq("shipment_id", row.id).maybeSingle(),
    supabase.from("rto_shipments").select("*").eq("original_shipment_id", row.id).maybeSingle(),
  ]);

  let trackingEventsList = (eventsResult.data ?? []).map((e: any) => ({
    id: e.id,
    shipmentId: e.shipment_id,
    userId: e.user_id,
    status: e.status,
    activity: e.activity,
    location: e.location,
    scanDatetime: e.scan_datetime,
    courierStatusCode: e.courier_status_code,
    rawPayload: e.raw_payload,
    createdAt: e.created_at,
  }));

  if (trackingEventsList.length === 0) {
    trackingEventsList = [
      {
        id: `evt-${row.id}`,
        shipmentId: row.id,
        userId: row.user_id,
        status: "MANIFESTED",
        activity: `AWB ${row.awb_number} generated & registered with ${row.courier_provider?.name || "Shadowfax"}`,
        location: (row as any).warehouse?.city || "Origin Fulfillment Hub",
        scanDatetime: row.created_at,
        courierStatusCode: "MAN",
        createdAt: row.created_at,
      },
    ];
  }

  return {
    shipment: {
      id: row.id,
      userId: row.user_id,
      orderId: row.order_id,
      order: (row as any).order,
      warehouseId: row.warehouse_id,
      warehouse: (row as any).warehouse,
      courierProviderId: row.courier_provider_id,
      courierProvider: (row as any).courier_provider,
      courierAccountId: row.courier_account_id,
      awbNumber: row.awb_number,
      trackingNumber: row.tracking_number,
      shipmentStatus: row.shipment_status,
      pickupPincode: row.pickup_pincode,
      deliveryPincode: row.delivery_pincode,
      paymentMode: row.payment_mode,
      codAmount: Number(row.cod_amount),
      declaredValue: Number(row.declared_value),
      weightKg: Number(row.weight_kg),
      lengthCm: Number(row.length_cm),
      widthCm: Number(row.width_cm),
      heightCm: Number(row.height_cm),
      volumetricWeightKg: Number(row.volumetric_weight_kg),
      chargeableWeightKg: Number(row.chargeable_weight_kg),
      shippingCharge: Number(row.shipping_charge),
      courierCharge: Number(row.courier_charge),
      sellerMargin: Number(row.seller_margin),
      pickupScheduledDate: row.pickup_scheduled_date,
      estimatedDeliveryDate: row.estimated_delivery_date,
      actualDeliveryDate: row.actual_delivery_date,
      labelUrl: row.label_url,
      manifestUrl: row.manifest_url,
      routingCode: row.routing_code,
      trackingUrl: row.tracking_url,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    trackingEvents: trackingEventsList,
    ndrCase: ndrResult.data
      ? {
          id: ndrResult.data.id,
          shipmentId: ndrResult.data.shipment_id,
          userId: ndrResult.data.user_id,
          attemptNumber: ndrResult.data.attempt_number,
          reasonCode: ndrResult.data.reason_code,
          reasonDescription: ndrResult.data.reason_description,
          ndrStatus: ndrResult.data.ndr_status,
          customerAction: ndrResult.data.customer_action,
          reattemptDate: ndrResult.data.reattempt_date,
          remark: ndrResult.data.remark,
          escalatedAt: ndrResult.data.escalated_at,
          resolvedAt: ndrResult.data.resolved_at,
          createdAt: ndrResult.data.created_at,
          updatedAt: ndrResult.data.updated_at,
        }
      : null,
    rtoShipment: rtoResult.data
      ? {
          id: rtoResult.data.id,
          originalShipmentId: rtoResult.data.original_shipment_id,
          userId: rtoResult.data.user_id,
          rtoAwbNumber: rtoResult.data.rto_awb_number,
          reason: rtoResult.data.reason,
          rtoStatus: rtoResult.data.rto_status,
          initiatedAt: rtoResult.data.initiated_at,
          deliveredAt: rtoResult.data.delivered_at,
          rtoShippingCharge: Number(rtoResult.data.rto_shipping_charge),
          createdAt: rtoResult.data.created_at,
          updatedAt: rtoResult.data.updated_at,
        }
      : null,
  };
}

export async function getDashboardKpis() {
  const session = await getEffectiveSession();
  if (!session) return mockEcommerceKpis;

  const { supabase, user } = session;

  const [
    profileRes,
    ordersRes,
    shipmentsRes,
    ndrRes,
    rtoRes,
  ] = await Promise.all([
    supabase.from("profiles").select("wallet_balance").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id, order_status, cod_amount, payment_mode").eq("user_id", user.id),
    supabase.from("ecommerce_shipments").select("id, shipment_status, shipping_charge, cod_amount, payment_mode").eq("user_id", user.id),
    supabase.from("ndr_cases").select("id").eq("user_id", user.id),
    supabase.from("rto_shipments").select("id").eq("user_id", user.id),
  ]);

  const orders = ordersRes.data || [];
  const shipments = shipmentsRes.data || [];
  const ndrCases = ndrRes.data || [];
  const rtoShipments = rtoRes.data || [];

  const totalOrders = orders.length;
  const readyToShip = orders.filter((o: any) => o.order_status === "READY_TO_SHIP").length;
  const inTransit = shipments.filter((s: any) =>
    ["MANIFESTED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.shipment_status),
  ).length;
  const delivered = shipments.filter((s: any) => s.shipment_status === "DELIVERED").length;
  const ndr = ndrCases.length;
  const rto = rtoShipments.length;

  const codPendingAmount = shipments
    .filter((s: any) => s.payment_mode === "COD" && s.shipment_status !== "DELIVERED")
    .reduce((sum: number, s: any) => sum + Number(s.cod_amount || 0), 0);

  const totalShippingSpend = shipments.reduce(
    (sum: number, s: any) => sum + Number(s.shipping_charge || 0),
    0,
  );
  const walletBalance = Number(profileRes.data?.wallet_balance || 0);

  const deliverySuccessRate =
    shipments.length > 0 ? Math.round((delivered / shipments.length) * 100) : 0;

  return {
    totalOrders,
    readyToShip,
    inTransit,
    delivered,
    ndr,
    rto,
    codPending: codPendingAmount,
    codPendingAmount,
    walletBalance,
    totalShippingSpend,
    deliverySuccessRate,
  };
}

export async function getNdrCases(): Promise<NdrCase[]> {
  const session = await getEffectiveSession();
  if (!session) return [];
  const { supabase, user } = session;

  const { data } = await supabase.from("ndr_cases").select("*").eq("user_id", user.id);
  return (data || []) as any;
}

export async function getRtoShipments(): Promise<RtoShipment[]> {
  const session = await getEffectiveSession();
  if (!session) return [];
  const { supabase, user } = session;

  const { data } = await supabase.from("rto_shipments").select("*").eq("user_id", user.id);
  return (data || []) as any;
}

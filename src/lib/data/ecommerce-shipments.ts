import {
  mockEcommerceKpis,
  mockEcommerceShipments,
  mockNdrCases,
  mockRtoShipments,
} from "@/data/mock-data";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  if (!supabase) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { shipments: [], total: 0, page: 1, pageCount: 1, isDemo: false };
  }

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

  if (paymentFilter !== "ALL") {
    dbQuery = dbQuery.eq("payment_mode", paymentFilter as any);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await dbQuery.range(from, to);

  if (error || !data || data.length === 0) {
    return {
      shipments: mockEcommerceShipments,
      total: mockEcommerceShipments.length,
      page: 1,
      pageCount: 1,
      isDemo: true,
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
  const supabase = await createClient();
  if (!supabase) {
    const shipment = mockEcommerceShipments.find((s) => s.id === shipmentId) ?? mockEcommerceShipments[0];
    const ndr = mockNdrCases.find((n) => n.shipmentId === shipment.id) ?? null;
    const rto = mockRtoShipments.find((r) => r.originalShipmentId === shipment.id) ?? null;

    const mockEvents: TrackingEvent[] = [
      {
        id: "evt-1",
        shipmentId: shipment.id,
        userId: "usr-demo",
        status: "DELIVERED",
        activity: "Shipment successfully delivered to consignee",
        location: "Koramangala DC, Bengaluru",
        scanDatetime: "2026-08-22T17:30:00Z",
        courierStatusCode: "DL",
        createdAt: "2026-08-22T17:30:00Z",
      },
      {
        id: "evt-2",
        shipmentId: shipment.id,
        userId: "usr-demo",
        status: "OUT_FOR_DELIVERY",
        activity: "Out for delivery with courier rider (Ramesh Kumar - +91 9887766554)",
        location: "Bengaluru South Hub",
        scanDatetime: "2026-08-22T08:15:00Z",
        courierStatusCode: "OFD",
        createdAt: "2026-08-22T08:15:00Z",
      },
      {
        id: "evt-3",
        shipmentId: shipment.id,
        userId: "usr-demo",
        status: "IN_TRANSIT",
        activity: "Arrived at destination gateway hub",
        location: "Bommasandra Hub, Bengaluru",
        scanDatetime: "2026-08-21T22:00:00Z",
        courierStatusCode: "ARV",
        createdAt: "2026-08-21T22:00:00Z",
      },
      {
        id: "evt-4",
        shipmentId: shipment.id,
        userId: "usr-demo",
        status: "PICKED_UP",
        activity: "Shipment picked up from Seller Warehouse",
        location: "Noida Hub",
        scanDatetime: "2026-08-20T18:00:00Z",
        courierStatusCode: "PU",
        createdAt: "2026-08-20T18:00:00Z",
      },
      {
        id: "evt-5",
        shipmentId: shipment.id,
        userId: "usr-demo",
        status: "MANIFESTED",
        activity: "AWB and Shipping Label created by Seller",
        location: "ShopWave Order System",
        scanDatetime: "2026-08-20T09:00:00Z",
        courierStatusCode: "MAN",
        createdAt: "2026-08-20T09:00:00Z",
      },
    ];

    return {
      shipment,
      trackingEvents: mockEvents,
      ndrCase: ndr,
      rtoShipment: rto,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { shipment: null, trackingEvents: [], ndrCase: null, rtoShipment: null };
  }

  const { data: row, error } = await supabase
    .from("ecommerce_shipments")
    .select(
      "*, order:orders(*, customer:customers(*), items:order_items(*)), warehouse:warehouses(*), courier_provider:courier_providers(*)",
    )
    .eq("id", shipmentId)
    .eq("user_id", user.id)
    .single();

  if (error || !row) {
    const fallback = mockEcommerceShipments.find((s) => s.id === shipmentId) ?? null;
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
      .eq("shipment_id", shipmentId)
      .order("scan_datetime", { ascending: false }),
    supabase.from("ndr_cases").select("*").eq("shipment_id", shipmentId).maybeSingle(),
    supabase.from("rto_shipments").select("*").eq("original_shipment_id", shipmentId).maybeSingle(),
  ]);

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
    trackingEvents: (eventsResult.data ?? []).map((e: any) => ({
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
    })),
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
  return mockEcommerceKpis;
}

export async function getNdrCases(): Promise<NdrCase[]> {
  return mockNdrCases;
}

export async function getRtoShipments(): Promise<RtoShipment[]> {
  return mockRtoShipments;
}

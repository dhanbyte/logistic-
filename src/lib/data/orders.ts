import { mockOrders, mockWarehouses } from "@/data/mock-data";
import { calculateChargeableWeight } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";
import type { OrderFormData } from "@/lib/validation/order";
import type { Database } from "@/types/database";

export type OrderQuery = {
  q?: string;
  status?: string;
  paymentMode?: string;
  channel?: string;
  page?: number;
  pageSize?: number;
};

export interface OrdersQueryResult {
  orders: Order[];
  total: number;
  page: number;
  pageCount: number;
  isDemo: boolean;
}

export async function getOrders(query?: OrderQuery): Promise<OrdersQueryResult> {
  const page = Math.max(1, Number(query?.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(query?.pageSize) || 10));
  const searchTerm = (query?.q ?? "").toLowerCase().trim();
  const statusFilter = query?.status ?? "ALL";
  const paymentFilter = query?.paymentMode ?? "ALL";
  const channelFilter = query?.channel ?? "ALL";

  const supabase = await createClient();
  if (!supabase) {
    let filtered = [...mockOrders];

    if (searchTerm) {
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchTerm) ||
          (o.customer?.fullName ?? "").toLowerCase().includes(searchTerm) ||
          (o.customer?.phone ?? "").includes(searchTerm) ||
          (o.items?.[0]?.productName ?? "").toLowerCase().includes(searchTerm),
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((o) => o.orderStatus === statusFilter);
    }

    if (paymentFilter !== "ALL") {
      filtered = filtered.filter((o) => o.paymentMode === paymentFilter);
    }

    if (channelFilter !== "ALL") {
      filtered = filtered.filter((o) => o.channelName === channelFilter);
    }

    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      orders: items,
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
    return { orders: [], total: 0, page: 1, pageCount: 1, isDemo: false };
  }

  let dbQuery = supabase
    .from("orders")
    .select(
      "*, customer:customers(*), warehouse:warehouses(*), items:order_items(*)",
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (searchTerm) {
    dbQuery = dbQuery.or(
      `order_number.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`,
    );
  }

  if (statusFilter !== "ALL") {
    dbQuery = dbQuery.eq("order_status", statusFilter as Database["public"]["Enums"]["order_status"]);
  }

  if (paymentFilter !== "ALL") {
    dbQuery = dbQuery.eq("payment_mode", paymentFilter as Database["public"]["Enums"]["payment_mode"]);
  }

  if (channelFilter !== "ALL") {
    dbQuery = dbQuery.eq("channel_name", channelFilter);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await dbQuery.range(from, to);

  if (error || !data) {
    return {
      orders: mockOrders,
      total: mockOrders.length,
      page: 1,
      pageCount: 1,
      isDemo: true,
    };
  }

  const mappedOrders: Order[] = data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    orderNumber: row.order_number,
    channelOrderId: row.channel_order_id,
    channelName: row.channel_name,
    customerId: row.customer_id,
    customer: row.customer
      ? {
          id: row.customer.id,
          userId: row.customer.user_id,
          fullName: row.customer.full_name,
          email: row.customer.email,
          phone: row.customer.phone,
          addressLine1: row.customer.address_line1,
          addressLine2: row.customer.address_line2,
          city: row.customer.city,
          state: row.customer.state,
          pincode: row.customer.pincode,
          country: row.customer.country,
          createdAt: row.customer.created_at,
          updatedAt: row.customer.updated_at,
        }
      : undefined,
    warehouseId: row.warehouse_id,
    warehouse: row.warehouse
      ? {
          id: row.warehouse.id,
          userId: row.warehouse.user_id,
          warehouseName: row.warehouse.warehouse_name,
          contactPerson: row.warehouse.contact_person,
          contactPhone: row.warehouse.contact_phone,
          contactEmail: row.warehouse.contact_email,
          addressLine1: row.warehouse.address_line1,
          addressLine2: row.warehouse.address_line2,
          city: row.warehouse.city,
          state: row.warehouse.state,
          pincode: row.warehouse.pincode,
          gstin: row.warehouse.gstin,
          isDefault: row.warehouse.is_default,
          isActive: row.warehouse.is_active,
          createdAt: row.warehouse.created_at,
          updatedAt: row.warehouse.updated_at,
        }
      : undefined,
    paymentMode: row.payment_mode,
    orderAmount: Number(row.order_amount),
    codAmount: Number(row.cod_amount),
    orderStatus: row.order_status,
    totalWeightKg: Number(row.total_weight_kg),
    lengthCm: Number(row.length_cm),
    widthCm: Number(row.width_cm),
    heightCm: Number(row.height_cm),
    volumetricWeightKg: Number(row.volumetric_weight_kg),
    chargeableWeightKg: Number(row.chargeable_weight_kg),
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    ewayBillNumber: row.eway_bill_number,
    notes: row.notes,
    items: row.items?.map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      productName: item.product_name,
      sku: item.sku,
      hsnCode: item.hsn_code,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      taxRate: Number(item.tax_rate),
      taxAmount: Number(item.tax_amount),
      totalAmount: Number(item.total_amount),
      weightGrams: Number(item.weight_grams),
      createdAt: item.created_at,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const total = count ?? mappedOrders.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    orders: mappedOrders,
    total,
    page,
    pageCount,
    isDemo: false,
  };
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createClient();
  if (!supabase) {
    return mockOrders.find((o) => o.id === orderId) ?? mockOrders[0];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("*, customer:customers(*), warehouse:warehouses(*), items:order_items(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return mockOrders.find((o) => o.id === orderId) ?? null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    orderNumber: data.order_number,
    channelOrderId: data.channel_order_id,
    channelName: data.channel_name,
    customerId: data.customer_id,
    customer: (data as any).customer,
    warehouseId: data.warehouse_id,
    warehouse: (data as any).warehouse,
    paymentMode: data.payment_mode,
    orderAmount: Number(data.order_amount),
    codAmount: Number(data.cod_amount),
    orderStatus: data.order_status,
    totalWeightKg: Number(data.total_weight_kg),
    lengthCm: Number(data.length_cm),
    widthCm: Number(data.width_cm),
    heightCm: Number(data.height_cm),
    volumetricWeightKg: Number(data.volumetric_weight_kg),
    chargeableWeightKg: Number(data.chargeable_weight_kg),
    invoiceNumber: data.invoice_number,
    invoiceDate: data.invoice_date,
    ewayBillNumber: data.eway_bill_number,
    notes: data.notes,
    items: (data as any).items,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

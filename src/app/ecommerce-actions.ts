"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateChargeableWeight } from "@/lib/calculations";
import { compareAllCourierRates, getCourierProvider } from "@/lib/couriers/registry";
import type { CourierRateQuote } from "@/lib/couriers/types";
import { toPaise, toRupees } from "@/lib/finance/money";
import {
  commitShippingReservation,
  computeAvailableFunds,
  getOrCreateWallet,
  releaseShippingReservation,
  reserveShippingFunds,
} from "@/lib/finance/wallet-service";
import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";
import { sendMetaConversionEvent } from "@/lib/meta-conversions";
import { orderFormSchema } from "@/lib/validation/order";
import { sellerProfileSchema } from "@/lib/validation/seller";
import { warehouseFormSchema } from "@/lib/validation/warehouse";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const idSchema = z.string().uuid();

async function auth() {
  return getEffectiveSession();
}

function refreshEcommerceData() {
  try {
    revalidatePath("/dashboard");
    revalidatePath("/orders");
    revalidatePath("/shipments");
    revalidatePath("/wallet");
    revalidatePath("/warehouses");
    revalidatePath("/settings");
    revalidatePath("/ndr");
    revalidatePath("/rto");
  } catch {
    // Ignore outside active HTTP request context
  }
}

/**
 * Creates a single Indian B2C E-Commerce Order
 */
export async function createEcommerceOrder(
  formData: FormData,
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const rawData = Object.fromEntries(formData);
    const parsed = orderFormSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        ok: false,
        message: "Please check the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const session = await auth();
    if (!session) {
      return { ok: false, message: "Please sign in to create an order." };
    }

    const { user, supabase } = session;
    const data = parsed.data;

    // 1. Create or Find Customer
    const { data: customerData, error: custError } = await supabase
      .from("customers")
      .insert({
        user_id: user.id,
        full_name: data.customerName,
        email: data.customerEmail || null,
        phone: data.customerPhone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: "India",
      })
      .select("id")
      .single();

    if (custError || !customerData) {
      console.error("[createEcommerceOrder.customer]", custError);
      return { ok: false, message: "Could not register customer delivery address." };
    }

    // 2. Resolve or create Warehouse
    let resolvedWarehouseId = data.warehouseId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedWarehouseId);

    if (!isUuid) {
      const { data: existingWh } = await supabase
        .from("warehouses")
        .select("id")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingWh) {
        resolvedWarehouseId = existingWh.id;
      } else {
        const { data: newWh } = await supabase
          .from("warehouses")
          .insert({
            user_id: user.id,
            warehouse_name: "Primary Fulfillment Hub",
            contact_person: "Operations Manager",
            contact_phone: "9876543210",
            address_line1: "Okhla Industrial Area, Phase III",
            city: "New Delhi",
            state: "Delhi",
            pincode: "110020",
            is_default: true,
            is_active: true,
          })
          .select("id")
          .single();
        if (newWh) resolvedWarehouseId = newWh.id;
      }
    }

    // 3. Compute weights
    const weightCalc = calculateChargeableWeight(data.weightKg, {
      lengthCm: data.lengthCm,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
    });

    // 4. Create Order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_id: customerData.id,
        warehouse_id: resolvedWarehouseId,
        order_number: data.orderNumber,
        channel_name: data.channelName,
        payment_mode: data.paymentMode,
        order_amount: data.orderAmount,
        cod_amount: data.paymentMode === "COD" ? data.codAmount : 0,
        order_status: "READY_TO_SHIP",
        total_weight_kg: data.weightKg,
        length_cm: data.lengthCm,
        width_cm: data.widthCm,
        height_cm: data.heightCm,
        chargeable_weight_kg: weightCalc.chargeableWeightKg,
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        invoice_date: new Date().toISOString().slice(0, 10),
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (orderError || !orderData) {
      console.error("[createEcommerceOrder.order]", orderError);
      return {
        ok: false,
        message:
          orderError?.code === "23505"
            ? "An order with this reference number already exists."
            : "The order could not be saved.",
      };
    }

    // 4. Create Order Item
    await supabase.from("order_items").insert({
      order_id: orderData.id,
      product_name: data.productName,
      sku: data.productSku || null,
      quantity: data.quantity,
      unit_price: data.orderAmount / data.quantity,
      tax_rate: 18.0,
      tax_amount: Math.round((data.orderAmount * 0.18) / 1.18 * 100) / 100,
      total_amount: data.orderAmount,
      weight_grams: Math.round(data.weightKg * 1000),
    });

    refreshEcommerceData();
    return { ok: true, data: { orderId: orderData.id } };
  } catch (error) {
    console.error("[createEcommerceOrder] unexpected", error);
    return { ok: false, message: "An unexpected error occurred while saving the order." };
  }
}

/**
 * Creates bulk orders from parsed CSV rows
 */
export async function createBulkOrders(
  rows: any[],
  warehouseId: string,
): Promise<ActionResult<{ count: number; orderIds: string[] }>> {
  try {
    const session = await auth();
    if (!session) {
      return { ok: false, message: "Please sign in to import bulk orders." };
    }

    let createdCount = 0;
    const orderIds: string[] = [];
    for (const row of rows) {
      const formData = new FormData();
      formData.append("orderNumber", String(row.orderNumber || `ORD-${Date.now()}-${createdCount}`));
      formData.append("warehouseId", warehouseId);
      formData.append("channelName", "MANUAL");
      formData.append("customerName", String(row.customerName || "Customer"));
      formData.append("customerPhone", String(row.customerPhone || "9876543210"));
      formData.append("customerEmail", String(row.customerEmail || ""));
      formData.append("addressLine1", String(row.addressLine1 || "Street Address"));
      formData.append("city", String(row.city || "New Delhi"));
      formData.append("state", String(row.state || "Delhi"));
      formData.append("pincode", String(row.pincode || "110001"));
      formData.append("productName", String(row.productName || "Item"));
      formData.append("quantity", String(row.quantity || 1));
      formData.append("paymentMode", String(row.paymentMode || "PREPAID"));
      formData.append("orderAmount", String(row.orderAmount || 500));
      formData.append("codAmount", String(row.codAmount || 0));
      formData.append("weightKg", String(row.weightKg || 0.5));
      formData.append("lengthCm", String(row.lengthCm || 10));
      formData.append("widthCm", String(row.widthCm || 10));
      formData.append("heightCm", String(row.heightCm || 10));

      const res = await createEcommerceOrder(formData);
      if (res.ok) {
        createdCount++;
        if (res.data?.orderId) orderIds.push(res.data.orderId);
      }
    }

    refreshEcommerceData();
    return { ok: true, data: { count: createdCount, orderIds } };
  } catch (error) {
    console.error("[createBulkOrders] unexpected", error);
    return { ok: false, message: "Bulk order import failed." };
  }
}

/**
 * Gets live user wallet balance
 */
export async function getWalletBalanceAction(): Promise<{ balance: number }> {
  try {
    const session = await auth();
    if (!session) {
      return { balance: 0 };
    }
    const wallet = await getOrCreateWallet(session.user.id);
    const computed = computeAvailableFunds(wallet);
    return { balance: toRupees(computed.cashBalancePaise) };
  } catch {
    return { balance: 0 };
  }
}

/**
 * Books a Courier Shipment for an existing order using the Courier Provider Layer
 */
export async function bookShipmentForOrder(
  orderId: string,
  courierCode: string,
  customDimensions?: {
    weightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  },
): Promise<ActionResult<{ awbNumber: string; shipmentId: string; labelUrl: string }>> {
  try {
    const session = await auth();
    const courier = getCourierProvider(courierCode);

    if (!session) {
      return { ok: false, message: "Please sign in to book a shipment." };
    }

    const { user, supabase } = session;

    // 0. Idempotency Check to prevent duplicate bookings
    const { data: existingShipment } = await supabase
      .from("ecommerce_shipments")
      .select("id, awb_number, label_url")
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingShipment) {
      return {
        ok: true,
        data: {
          awbNumber: existingShipment.awb_number,
          shipmentId: existingShipment.id,
          labelUrl: existingShipment.label_url ?? "",
        },
      };
    }

    // 1. Fetch Order and Warehouse details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, customer:customers(*), warehouse:warehouses(*), items:order_items(*)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return { ok: false, message: "Order not found." };
    }

    const firstItem = (order as any).items?.[0];

    // 1.2 Calculate Dynamic Volumetric & Chargeable Weight
    const deadWeightKg = customDimensions?.weightKg ?? (Number(order.total_weight_kg) || 0.5);
    const lengthCm = customDimensions?.lengthCm ?? (Number(order.length_cm) || 10);
    const widthCm = customDimensions?.widthCm ?? (Number(order.width_cm) || 10);
    const heightCm = customDimensions?.heightCm ?? (Number(order.height_cm) || 10);
    const volumetricKg = (lengthCm * widthCm * heightCm) / 5000;
    const chargeableWeightKg = Math.max(deadWeightKg, volumetricKg);

    // Persist updated dimensions to order if provided
    if (customDimensions) {
      await supabase
        .from("orders")
        .update({
          total_weight_kg: deadWeightKg,
          length_cm: lengthCm,
          width_cm: widthCm,
          height_cm: heightCm,
          chargeable_weight_kg: chargeableWeightKg,
        })
        .eq("id", orderId);
    }

    // 1.3 Get Dynamic Courier Rate Quote
    const rateQuote = await courier.calculateRate(
      {
        pickupPincode: (order as any).warehouse?.pincode || (order as any).pickup_pincode || "110020",
        deliveryPincode: (order as any).customer?.pincode || (order as any).delivery_pincode || "400001",
        weightKg: chargeableWeightKg,
        paymentMode: order.payment_mode,
        declaredValue: Number(order.order_amount) || 500,
      },
      {
        deadWeightKg,
        volumetricWeightKg: volumetricKg,
        chargeableWeightKg,
      },
    );

    const dynamicShippingCost = rateQuote ? rateQuote.totalShippingCost : 49;
    const freightPaise = toPaise(dynamicShippingCost);

    // 1.5 Atomic Two-Phase Wallet Fund Reservation
    const reservationRes = await reserveShippingFunds({
      userId: user.id,
      orderId: order.id,
      amountPaise: freightPaise,
    });

    if (!reservationRes.ok) {
      return {
        ok: false,
        message: `${reservationRes.message} (Shipping Charge: ₹${dynamicShippingCost.toFixed(2)} for ${chargeableWeightKg.toFixed(2)} kg)`,
      };
    }

    let bookingResult;
    try {
      // 2. Call Courier Abstraction Layer
      bookingResult = await courier.createShipment({
        orderId: order.id,
        orderNumber: order.order_number,
        warehouseId: order.warehouse_id,
        courierCode,
        pickupPincode: (order as any).warehouse?.pincode || (order as any).pickup_pincode || "110020",
        deliveryPincode: (order as any).customer?.pincode || (order as any).delivery_pincode || "400001",
        customerName: (order as any).customer?.full_name || "Customer",
        customerPhone: (order as any).customer?.phone || "9876543210",
        customerAddress: (order as any).customer?.address_line1 || "Customer Address",
        customerCity: (order as any).customer?.city || "New Delhi",
        customerState: (order as any).customer?.state || "Delhi",
        productName: firstItem?.product_name || "E-Commerce Package",
        productSku: firstItem?.sku || "SKU-001",
        quantity: firstItem?.quantity || 1,
        paymentMode: order.payment_mode,
        orderAmount: Number(order.order_amount),
        codAmount: Number(order.cod_amount),
        weightKg: chargeableWeightKg,
        lengthCm,
        widthCm,
        heightCm,
        warehouseName: (order as any).warehouse?.warehouse_name || "Central Warehouse",
        warehouseAddress: (order as any).warehouse?.address_line1 || "Plot 12, Industrial Area",
        warehouseCity: (order as any).warehouse?.city || "New Delhi",
        warehouseState: (order as any).warehouse?.state || "Delhi",
        warehousePhone: (order as any).warehouse?.contact_phone || "9876543210",
      });
    } catch (err: any) {
      if (reservationRes.reservationId) {
        await releaseShippingReservation({
          reservationId: reservationRes.reservationId,
          reason: "Courier booking failure",
        });
      }
      return { ok: false, message: err.message || "Courier booking failed." };
    }

    // 3. Find courier provider ID
    const { data: providerRow } = await supabase
      .from("courier_providers")
      .select("id")
      .eq("code", courierCode)
      .maybeSingle();

    const providerId = providerRow?.id ?? crypto.randomUUID();

    // 4. Insert into ecommerce_shipments
    const { data: shipmentRow, error: shipError } = await supabase
      .from("ecommerce_shipments")
      .insert({
        user_id: user.id,
        order_id: order.id,
        warehouse_id: order.warehouse_id,
        courier_provider_id: providerId,
        awb_number: bookingResult.awbNumber,
        tracking_number: bookingResult.awbNumber,
        shipment_status: "MANIFESTED",
        pickup_pincode: (order as any).warehouse?.pincode || "110001",
        delivery_pincode: (order as any).customer?.pincode || "400001",
        payment_mode: order.payment_mode,
        cod_amount: Number(order.cod_amount),
        declared_value: Number(order.order_amount),
        weight_kg: Number(order.total_weight_kg),
        length_cm: Number(order.length_cm),
        width_cm: Number(order.width_cm),
        height_cm: Number(order.height_cm),
        chargeable_weight_kg: Number(order.chargeable_weight_kg),
        shipping_charge: bookingResult.shippingCharge,
        courier_charge: bookingResult.courierCharge,
        pickup_scheduled_date: bookingResult.pickupScheduledDate,
        estimated_delivery_date: bookingResult.estimatedDeliveryDate,
        label_url: bookingResult.labelUrl,
        manifest_url: bookingResult.manifestUrl,
        routing_code: bookingResult.routingCode,
        tracking_url: bookingResult.trackingUrl,
      })
      .select("id")
      .single();

    if (shipError || !shipmentRow) {
      if (reservationRes.reservationId) {
        await releaseShippingReservation({
          reservationId: reservationRes.reservationId,
          reason: "Shipment database record error",
        });
      }
      return { ok: false, message: "Could not generate shipment record." };
    }

    // 5. Store Label Document
    if (bookingResult.labelUrl) {
      await supabase.from("shipment_documents").insert({
        shipment_id: shipmentRow.id,
        original_name: `Label-${bookingResult.awbNumber}.pdf`,
        storage_path: bookingResult.labelUrl,
        mime_type: "application/pdf",
        size_bytes: 1024,
      });
    }

    // 6. Update Order Status
    await supabase
      .from("orders")
      .update({ order_status: "PENDING_PICKUP" })
      .eq("id", order.id);

    // 7. Record Initial Tracking Event
    await supabase.from("tracking_events").insert({
      shipment_id: shipmentRow.id,
      user_id: user.id,
      status: "MANIFESTED",
      activity: `AWB ${bookingResult.awbNumber} generated with ${courier.name}`,
      location: (order as any).warehouse?.city || "Warehouse",
      courier_status_code: "MANIFEST",
    });

    // 8. Commit Two-Phase Reservation and record ledger
    if (reservationRes.reservationId) {
      await commitShippingReservation({
        reservationId: reservationRes.reservationId,
        shipmentId: shipmentRow.id,
        awbNumber: bookingResult.awbNumber,
      });
    }

    refreshEcommerceData();
    return {
      ok: true,
      data: {
        awbNumber: bookingResult.awbNumber,
        shipmentId: shipmentRow.id,
        labelUrl: bookingResult.labelUrl,
      },
    };
  } catch (error: any) {
    console.error("[bookShipmentForOrder] unexpected", error);
    return { ok: false, message: error.message || "Failed to book courier shipment." };
  }
}

/**
 * Cancels a booked shipment
 */
export async function cancelShipmentAction(
  shipmentId: string,
  awbNumber: string,
  courierCode: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    const courier = getCourierProvider(courierCode);
    const cancelResult = await courier.cancelShipment(awbNumber);

    if (!cancelResult.success) {
      return { ok: false, message: cancelResult.message || "Courier rejected cancellation." };
    }

    if (session) {
      const { user, supabase } = session;

      await supabase
        .from("ecommerce_shipments")
        .update({ shipment_status: "CANCELLED" as any })
        .eq("id", shipmentId)
        .eq("user_id", user.id);

      await supabase.from("tracking_events").insert({
        shipment_id: shipmentId,
        user_id: user.id,
        status: "CANCELLED",
        activity: `Shipment cancelled with ${courier.name}`,
        location: "Seller Portal",
        courier_status_code: "CANCELLED",
      });
    }

    refreshEcommerceData();
    return { ok: true };
  } catch (error: any) {
    return { ok: false, message: error.message || "Failed to cancel shipment." };
  }
}

/**
 * Updates status of an order
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { ok: false, message: "Authentication required." };
    }

    const { data, error } = await session.supabase
      .from("orders")
      .update({ order_status: newStatus as any })
      .eq("id", orderId)
      .eq("user_id", session.user.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: "Could not update order status." };
    }

    refreshEcommerceData();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Status update failed." };
  }
}

/**
 * Resolves an NDR (Non-Delivery Report) Case
 */
export async function resolveNdrAction(
  ndrId: string,
  customerAction: "REATTEMPT" | "CHANGE_ADDRESS" | "RTO",
  reattemptDate?: string,
  remark?: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { ok: false, message: "Authentication required." };
    }

    const { data, error } = await session.supabase
      .from("ndr_cases")
      .update({
        customer_action: customerAction,
        ndr_status: customerAction === "RTO" ? "RTO_REQUESTED" : "REATTEMPT_SCHEDULED",
        reattempt_date: reattemptDate || null,
        remark: remark || null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", ndrId)
      .eq("user_id", session.user.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: "Could not submit NDR action." };
    }

    refreshEcommerceData();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Failed to resolve NDR case." };
  }
}

/**
 * Recharges Seller Prepaid Wallet (Protected: strictly requires Razorpay PG verification)
 */
export async function rechargeWallet(_amount: number): Promise<ActionResult<{ newBalance: number }>> {
  return {
    ok: false,
    message: "Direct balance adjustment is disabled. All wallet recharges must be completed via Razorpay Payment Gateway.",
  };
}

/**
 * Upserts a Warehouse
 */
export async function upsertWarehouse(
  formData: FormData,
  warehouseId?: string,
): Promise<ActionResult> {
  try {
    const rawData = Object.fromEntries(formData);
    const parsed = warehouseFormSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        ok: false,
        message: "Check highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const session = await auth();
    if (!session) {
      return { ok: false, message: "Authentication required to save warehouse." };
    }

    const payload = {
      warehouse_name: parsed.data.warehouseName,
      contact_person: parsed.data.contactPerson,
      contact_phone: parsed.data.contactPhone,
      contact_email: parsed.data.contactEmail || null,
      address_line1: parsed.data.addressLine1,
      address_line2: parsed.data.addressLine2 || null,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      gstin: parsed.data.gstin || null,
      is_default: parsed.data.isDefault,
    };

    if (warehouseId) {
      await session.supabase
        .from("warehouses")
        .update(payload)
        .eq("id", warehouseId)
        .eq("user_id", session.user.id);
    } else {
      await session.supabase
        .from("warehouses")
        .insert({ ...payload, user_id: session.user.id });
    }

    refreshEcommerceData();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Could not save warehouse." };
  }
}

/**
 * Fast Onboarding Godown Setup Action
 */
export async function saveGodownOnboardingAction(payload: {
  warehouseName: string;
  contactPerson: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}): Promise<ActionResult<{ warehouseId: string }>> {
  try {
    const session = await auth();
    if (!session) {
      return { ok: false, message: "Authentication required to configure godown." };
    }

    const cleanPin = payload.pincode.replace(/\D/g, "").slice(0, 6);
    const cleanPhone = payload.contactPhone.replace(/\D/g, "").slice(-10);

    if (cleanPin.length !== 6) {
      return { ok: false, message: "Valid 6-digit Indian PIN code is required." };
    }

    // Check if user has an existing default/starter warehouse
    const { data: existingWarehouses } = await session.supabase
      .from("warehouses")
      .select("id, warehouse_name, pincode")
      .eq("user_id", session.user.id);

    let warehouseIdToReturn = "";

    // If user only has 1 warehouse (starter/placeholder), update it directly to avoid duplicate
    if (existingWarehouses && existingWarehouses.length === 1) {
      const targetId = existingWarehouses[0].id;
      const { data, error } = await session.supabase
        .from("warehouses")
        .update({
          warehouse_name: payload.warehouseName.trim() || "Main Pickup Godown",
          contact_person: payload.contactPerson.trim() || "Warehouse Manager",
          contact_phone: cleanPhone || "9876543210",
          address_line1: payload.addressLine1.trim(),
          address_line2: payload.addressLine2?.trim() || null,
          city: payload.city.trim(),
          state: payload.state.trim(),
          pincode: cleanPin,
          is_default: true,
        })
        .eq("id", targetId)
        .eq("user_id", session.user.id)
        .select("id")
        .single();

      if (error || !data) {
        return { ok: false, message: error?.message || "Could not update pickup godown." };
      }
      warehouseIdToReturn = data.id;
    } else {
      // Set other warehouses to non-default
      await session.supabase
        .from("warehouses")
        .update({ is_default: false })
        .eq("user_id", session.user.id);

      // Insert new verified godown
      const { data, error } = await session.supabase
        .from("warehouses")
        .insert({
          user_id: session.user.id,
          warehouse_name: payload.warehouseName.trim() || "Main Pickup Godown",
          contact_person: payload.contactPerson.trim() || "Warehouse Manager",
          contact_phone: cleanPhone || "9876543210",
          address_line1: payload.addressLine1.trim(),
          address_line2: payload.addressLine2?.trim() || null,
          city: payload.city.trim(),
          state: payload.state.trim(),
          pincode: cleanPin,
          is_default: true,
        })
        .select("id")
        .single();

      if (error || !data) {
        return { ok: false, message: error?.message || "Could not register pickup godown." };
      }
      warehouseIdToReturn = data.id;
    }

    refreshEcommerceData();
    return { ok: true, data: { warehouseId: warehouseIdToReturn } };
  } catch (err: any) {
    return { ok: false, message: err.message || "Failed to save godown." };
  }
}

/**
 * Sets Default Warehouse
 */
export async function setDefaultWarehouse(warehouseId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { ok: false, message: "Authentication required." };
    }

    // Reset others to false
    await session.supabase
      .from("warehouses")
      .update({ is_default: false })
      .eq("user_id", session.user.id);

    // Set target to true
    await session.supabase
      .from("warehouses")
      .update({ is_default: true })
      .eq("id", warehouseId)
      .eq("user_id", session.user.id);

    refreshEcommerceData();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Could not set default warehouse." };
  }
}

/**
 * Deletes a Warehouse / Pickup Hub
 */
export async function deleteWarehouseAction(warehouseId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { ok: false, message: "Authentication required." };
    }

    const { supabase, user } = session;

    // 1. Find if there is another warehouse to reassign orders to
    const { data: otherWarehouses } = await supabase
      .from("warehouses")
      .select("id, is_default")
      .neq("id", warehouseId)
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (otherWarehouses && otherWarehouses.length > 0) {
      const fallbackWhId = otherWarehouses[0].id;

      // Reassign all referencing orders and shipments to the remaining warehouse
      await supabase
        .from("orders")
        .update({ warehouse_id: fallbackWhId })
        .eq("warehouse_id", warehouseId)
        .eq("user_id", user.id);

      await supabase
        .from("ecommerce_shipments")
        .update({ warehouse_id: fallbackWhId })
        .eq("warehouse_id", warehouseId)
        .eq("user_id", user.id);

      // If the deleted warehouse was default, make the other one default
      const hasDefault = otherWarehouses.some((w: any) => w.is_default);
      if (!hasDefault) {
        await supabase
          .from("warehouses")
          .update({ is_default: true })
          .eq("id", fallbackWhId)
          .eq("user_id", user.id);
      }
    } else {
      // If this was the only warehouse, clean up draft orders that reference it
      const { data: ordersWithWh } = await supabase
        .from("orders")
        .select("id")
        .eq("warehouse_id", warehouseId)
        .eq("user_id", user.id);

      if (ordersWithWh && ordersWithWh.length > 0) {
        const orderIds = ordersWithWh.map((o: any) => o.id);
        await supabase.from("order_items").delete().in("order_id", orderIds);
        await supabase.from("ecommerce_shipments").delete().in("order_id", orderIds);
        await supabase.from("orders").delete().in("id", orderIds).eq("user_id", user.id);
      }
    }

    // 2. Safely delete the warehouse
    const { error } = await supabase
      .from("warehouses")
      .delete()
      .eq("id", warehouseId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, message: error.message || "Could not delete warehouse." };
    }

    refreshEcommerceData();
    return { ok: true, message: "Warehouse deleted successfully." };
  } catch (error: any) {
    return { ok: false, message: error.message || "Failed to delete warehouse." };
  }
}

/**
 * Updates Seller Profile and Business Details
 */
export async function updateSellerProfile(formData: FormData): Promise<ActionResult> {
  try {
    const rawData = Object.fromEntries(formData);
    const parsed = sellerProfileSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        ok: false,
        message: "Check highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const session = await auth();
    if (!session) {
      return { ok: false, message: "Authentication required to update seller profile." };
    }

    const { user, supabase } = session;

    // Update profile
    await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        company_name: parsed.data.companyName,
        phone: parsed.data.phone,
        gstin: parsed.data.gstin || undefined,
        pan: parsed.data.pan || undefined,
      })
      .eq("id", user.id);

    // Upsert seller_account
    await supabase.from("seller_accounts").upsert(
      {
        user_id: user.id,
        company_name: parsed.data.companyName,
        brand_name: parsed.data.brandName,
        gstin: parsed.data.gstin || null,
        pan: parsed.data.pan || null,
        billing_address: parsed.data.billingAddress,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
        email: user.email || "",
        phone: parsed.data.phone,
      },
      { onConflict: "user_id" },
    );

    refreshEcommerceData();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Could not save seller profile." };
  }
}

/**
 * Server action to compare courier rates securely on the server
 */
export async function fetchCourierRatesAction(params: {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  paymentMode: "PREPAID" | "COD";
  declaredValue: number;
}): Promise<CourierRateQuote[]> {
  const weightCalc = calculateChargeableWeight(params.weightKg, {
    lengthCm: params.lengthCm,
    widthCm: params.widthCm,
    heightCm: params.heightCm,
  });

  return compareAllCourierRates(
    {
      pickupPincode: params.pickupPincode,
      deliveryPincode: params.deliveryPincode,
      weightKg: weightCalc.chargeableWeightKg,
      paymentMode: params.paymentMode,
      declaredValue: params.declaredValue,
    },
    weightCalc,
  );
}

/**
 * Update an existing customer order
 */
export async function updateOrderAction(
  orderId: string,
  payload: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    paymentMode: "PREPAID" | "COD";
    orderAmount: number;
    codAmount: number;
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    productName?: string;
    quantity?: number;
    sku?: string;
  },
): Promise<ActionResult> {
  const session = await getEffectiveSession();
  if (!session) return { ok: false, message: "Authentication required." };
  const { supabase, user } = session;

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, order_status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) return { ok: false, message: "Order not found." };

  const volumetricWeightKg = (payload.lengthCm * payload.widthCm * payload.heightCm) / 5000;
  const chargeableWeightKg = Math.max(payload.weightKg, volumetricWeightKg);

  if (order.customer_id) {
    await supabase
      .from("customers")
      .update({
        full_name: payload.customerName,
        phone: payload.customerPhone,
        email: payload.customerEmail || null,
        address_line1: payload.addressLine1,
        city: payload.city,
        state: payload.state,
        pincode: payload.pincode,
      })
      .eq("id", order.customer_id);
  }

  const { error: orderError } = await supabase
    .from("orders")
    .update({
      payment_mode: payload.paymentMode,
      order_amount: payload.orderAmount,
      cod_amount: payload.paymentMode === "COD" ? payload.codAmount : 0,
      total_weight_kg: payload.weightKg,
      length_cm: payload.lengthCm,
      width_cm: payload.widthCm,
      height_cm: payload.heightCm,
      chargeable_weight_kg: chargeableWeightKg,
    })
    .eq("id", orderId);

  if (orderError) {
    console.error("[updateOrderAction.error]", orderError);
    return { ok: false, message: orderError.message || "Failed to update order details." };
  }

  if (payload.productName) {
    await supabase
      .from("order_items")
      .update({
        product_name: payload.productName,
        quantity: payload.quantity || 1,
        sku: payload.sku || null,
        unit_price: payload.orderAmount,
        total_amount: payload.orderAmount,
        weight_grams: Math.round(Number(payload.weightKg || 0.5) * 1000),
      })
      .eq("order_id", orderId);
  }

  refreshEcommerceData();
  return { ok: true, message: "Order updated successfully." };
}

/**
 * Cancel an unfulfilled or manifested order and void courier AWB
 */
export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  const session = await getEffectiveSession();
  if (!session) return { ok: false, message: "Authentication required." };
  const { supabase, user } = session;

  // 1. Fetch any linked shipment
  const { data: shipment } = await supabase
    .from("ecommerce_shipments")
    .select("id, awb_number, shipping_charge, created_at, courier_provider:courier_providers(code)")
    .eq("order_id", orderId)
    .maybeSingle();

  let refundMsg = "";

  if (shipment && shipment.awb_number) {
    try {
      const courierCode = (shipment.courier_provider as any)?.code || (shipment.awb_number.startsWith("SF") ? "shadowfax" : "xpressbees");
      const provider = getCourierProvider(courierCode);
      if (provider) {
        await provider.cancelShipment(shipment.awb_number);
      }
    } catch (e: any) {
      console.warn("[cancelOrderAction.courierCancel]", e.message);
    }

    // Update shipment status
    await supabase
      .from("ecommerce_shipments")
      .update({ shipment_status: "CANCELLED" })
      .eq("id", shipment.id);

    // Process 5-hour cancellation refund policy
    if (shipment.shipping_charge && Number(shipment.shipping_charge) > 0) {
      const { processShipmentCancellationRefund } = await import("@/lib/finance/wallet-service");
      const refundResult = await processShipmentCancellationRefund({
        userId: user.id,
        orderId,
        awbNumber: shipment.awb_number,
        shippingChargePaise: toPaise(Number(shipment.shipping_charge)),
        shipmentCreatedAt: shipment.created_at || new Date(),
      });
      if (refundResult.ok) {
        refundMsg = ` ${refundResult.message}`;
      }
    }

    // Record tracking event
    await supabase.from("tracking_events").insert({
      shipment_id: shipment.id,
      user_id: user.id,
      status: "CANCELLED",
      activity: `Shipment & AWB ${shipment.awb_number} cancelled with courier partner`,
      location: "Fulfillment Hub",
      scan_datetime: new Date().toISOString(),
    });
  }

  const { error } = await supabase
    .from("orders")
    .update({ order_status: "CANCELLED" })
    .eq("id", orderId)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: "Failed to cancel order." };

  refreshEcommerceData();
  return { ok: true, message: `Order and Courier AWB cancelled successfully.${refundMsg}` };
}

/**
 * Delete a draft/unfulfilled order permanently
 */
export async function deleteOrderAction(orderId: string): Promise<ActionResult> {
  const session = await getEffectiveSession();
  if (!session) return { ok: false, message: "Authentication required." };
  const { supabase, user } = session;

  await supabase.from("order_items").delete().eq("order_id", orderId);
  await supabase.from("ecommerce_shipments").delete().eq("order_id", orderId);
  const { error } = await supabase.from("orders").delete().eq("id", orderId).eq("user_id", user.id);

  if (error) return { ok: false, message: "Failed to delete order." };

  refreshEcommerceData();
  return { ok: true, message: "Order deleted successfully." };
}

/**
 * Bulk cancel multiple orders and void courier AWBs
 */
export async function bulkCancelOrdersAction(orderIds: string[]): Promise<ActionResult> {
  const session = await getEffectiveSession();
  if (!session) return { ok: false, message: "Authentication required." };
  const { supabase, user } = session;

  for (const id of orderIds) {
    await cancelOrderAction(id);
  }

  refreshEcommerceData();
  return { ok: true, message: `Successfully cancelled ${orderIds.length} orders on both platform and courier systems.` };
}

/**
 * Clone an existing or cancelled order into a new READY_TO_SHIP order
 */
export async function cloneOrderAction(
  orderId: string,
): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  const session = await getEffectiveSession();
  if (!session) return { ok: false, message: "Authentication required." };
  const { supabase, user } = session;

  // 1. Fetch original order
  const { data: original, error: fetchErr } = await supabase
    .from("orders")
    .select("*, customer:customers(*), items:order_items(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !original) {
    return { ok: false, message: "Original order not found." };
  }

  // 2. Generate new unique order number
  const newOrderNumber = `ORD-${Date.now().toString().slice(-6)}`;

  // 3. Insert cloned order with READY_TO_SHIP status
  const { data: newOrder, error: insertErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      customer_id: original.customer_id,
      warehouse_id: original.warehouse_id,
      order_number: newOrderNumber,
      channel_name: original.channel_name || "MANUAL",
      order_status: "READY_TO_SHIP",
      payment_mode: original.payment_mode,
      order_amount: original.order_amount,
      cod_amount: original.cod_amount,
      total_weight_kg: original.total_weight_kg,
      length_cm: original.length_cm,
      width_cm: original.width_cm,
      height_cm: original.height_cm,
      chargeable_weight_kg: original.chargeable_weight_kg,
      notes: `Cloned from ${original.order_number}`,
    })
    .select("id, order_number")
    .single();

  if (insertErr || !newOrder) {
    return { ok: false, message: "Failed to clone order." };
  }

  // 4. Duplicate items
  if (original.items && original.items.length > 0) {
    const itemsToInsert = original.items.map((item: any) => ({
      order_id: newOrder.id,
      product_name: item.product_name,
      quantity: Number(item.quantity) || 1,
      sku: item.sku || null,
      unit_price: Number(item.unit_price) || 0,
      total_amount: Number(item.total_amount) || 0,
      weight_grams: Number(item.weight_grams) || Math.round((Number(item.weight_kg) || 0.5) * 1000),
    }));
    await supabase.from("order_items").insert(itemsToInsert);
  }

  refreshEcommerceData();
  return {
    ok: true,
    data: { orderId: newOrder.id, orderNumber: newOrder.order_number },
    message: `Order successfully cloned as ${newOrder.order_number}! Ready to ship.`,
  };
}

/**
 * Bulk delete multiple orders
 */
export async function bulkDeleteOrdersAction(orderIds: string[]): Promise<ActionResult> {
  const session = await getEffectiveSession();
  if (!session) return { ok: false, message: "Authentication required." };
  const { supabase, user } = session;

  await supabase.from("order_items").delete().in("order_id", orderIds);
  await supabase.from("ecommerce_shipments").delete().in("order_id", orderIds);
  const { error } = await supabase.from("orders").delete().in("id", orderIds).eq("user_id", user.id);

  if (error) return { ok: false, message: "Failed to delete selected orders." };

  refreshEcommerceData();
  return { ok: true, message: `Successfully deleted ${orderIds.length} orders.` };
}

/**
 * Bulk generate AWBs for selected orders
 */
export async function bulkShipOrdersAction(
  orderIds: string[],
  courierCode = "shadowfax",
): Promise<{ ok: boolean; count: number; failed: number; message: string }> {
  let successCount = 0;
  let failedCount = 0;

  for (const id of orderIds) {
    const res = await bookShipmentForOrder(id, courierCode);
    if (res.ok) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  refreshEcommerceData();
  return {
    ok: successCount > 0,
    count: successCount,
    failed: failedCount,
    message: `Generated AWBs for ${successCount} orders.${failedCount > 0 ? ` (${failedCount} failed)` : ""}`,
  };
}

/**
 * Register a new real seller account and initialize default profile, wallet, and warehouse
 */
export async function registerSellerAction(payload: {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  phone: string;
}): Promise<ActionResult<{ userId: string }>> {
  const serviceClient = createServiceClient();
  if (!serviceClient) return { ok: false, message: "Database connection unavailable." };

  const cleanEmail = payload.email.trim().toLowerCase();

  try {
    // 1. Create or signup auth user
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: cleanEmail,
      password: payload.password,
      email_confirm: true, // auto-confirm email so they can log in immediately
      user_metadata: {
        full_name: payload.fullName,
        company_name: payload.companyName,
        phone: payload.phone,
      },
    });

    if (authError || !authData?.user) {
      // If admin createUser fails, check if user already exists
      return { ok: false, message: authError?.message || "Failed to create seller account." };
    }

    const userId = authData.user.id;

    // 2. Initialize Profile
    await serviceClient.from("profiles").upsert({
      id: userId,
      email: cleanEmail,
      full_name: payload.fullName,
      company_name: payload.companyName,
      phone: payload.phone,
      wallet_balance: 0, // Zero initial balance for new sellers (must recharge to use)
      kyc_status: "VERIFIED",
      updated_at: new Date().toISOString(),
    });

    // 4. Create default initial pickup location
    await serviceClient.from("warehouses").insert({
      user_id: userId,
      warehouse_name: `${payload.companyName || payload.fullName || "Primary"} Hub`,
      contact_person: payload.fullName || "Logistics Manager",
      contact_phone: payload.phone || "9876543210",
      address_line1: "Main Fulfillment Center",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110020",
      is_default: true,
      is_active: true,
    });

    // 5. Fire Meta Conversions API (CAPI) CompleteRegistration Event
    sendMetaConversionEvent({
      eventName: "CompleteRegistration",
      userData: {
        email: cleanEmail,
        phone: payload.phone,
        firstName: payload.fullName.split(" ")[0] || payload.fullName,
        lastName: payload.fullName.split(" ").slice(1).join(" ") || undefined,
        city: "New Delhi",
        state: "Delhi",
        pincode: "110020",
        country: "in",
      },
      customData: {
        content_name: "Seller Free Account Registration",
        status: "success",
      },
    }).catch((capiErr) => console.error("[Meta CAPI Registration Error]", capiErr));

    return {
      ok: true,
      data: { userId },
      message: "Seller account created successfully! Signing you in...",
    };
  } catch (err: any) {
    return { ok: false, message: err.message || "Registration failed." };
  }
}

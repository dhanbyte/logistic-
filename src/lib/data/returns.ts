import { getEffectiveSession } from "@/lib/supabase/server";

export interface CustomerReturn {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  returnReason: string;
  awb: string;
  courier: string;
  status: string;
  refundAmount: number;
  date: string;
}

export async function getCustomerReturns(): Promise<CustomerReturn[]> {
  const session = await getEffectiveSession();
  if (!session) return [];

  const { supabase, user } = session;

  try {
    // 1. Fetch RTO / Return Shipments for this merchant
    const { data: rtoData } = await supabase
      .from("rto_shipments")
      .select(
        "id, rto_awb_number, reason, rto_status, initiated_at, rto_shipping_charge, original_shipment:ecommerce_shipments(id, awb_number, order:orders(id, order_number, order_amount, customer:customers(full_name, phone)), courier_provider:courier_providers(name))",
      )
      .eq("user_id", user.id)
      .order("initiated_at", { ascending: false });

    if (rtoData && rtoData.length > 0) {
      return rtoData.map((item: any) => ({
        id: item.id,
        orderId: item.original_shipment?.order?.id || item.id,
        orderNumber: item.original_shipment?.order?.order_number || "ORD-RETURN",
        customerName: item.original_shipment?.order?.customer?.full_name || "Customer",
        customerPhone: item.original_shipment?.order?.customer?.phone,
        returnReason: item.reason || "Customer return / Delivery rejected",
        awb: item.rto_awb_number || item.original_shipment?.awb_number || "AWB-PENDING",
        courier: item.original_shipment?.courier_provider?.name || "Shadowfax Reverse",
        status: item.rto_status || "RTO_INITIATED",
        refundAmount: Number(item.original_shipment?.order?.order_amount || 0),
        date: item.initiated_at ? item.initiated_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      }));
    }

    // 2. Also check if any orders have RTO / Return status directly
    const { data: returnOrders } = await supabase
      .from("orders")
      .select(
        "id, order_number, order_amount, order_status, created_at, customer:customers(full_name, phone), shipments:ecommerce_shipments(awb_number, courier_provider:courier_providers(name))",
      )
      .eq("user_id", user.id)
      .in("order_status", ["RTO_INITIATED", "RTO_DELIVERED", "NDR"] as any)
      .order("created_at", { ascending: false });

    if (returnOrders && returnOrders.length > 0) {
      return returnOrders.map((order: any) => {
        const shipment = order.shipments?.[0];
        return {
          id: order.id,
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: order.customer?.full_name || "Customer",
          customerPhone: order.customer?.phone,
          returnReason: order.order_status === "NDR" ? "Failed Delivery - NDR Hold" : "Return to Origin (RTO)",
          awb: shipment?.awb_number || "AWB-PENDING",
          courier: shipment?.courier_provider?.name || "Courier Partner",
          status: order.order_status,
          refundAmount: Number(order.order_amount || 0),
          date: order.created_at ? order.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        };
      });
    }

    return [];
  } catch (err) {
    console.error("[getCustomerReturns] error:", err);
    return [];
  }
}

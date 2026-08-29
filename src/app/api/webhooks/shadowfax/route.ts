import { NextResponse } from "next/server";
import { mapShadowfaxStatus } from "@/lib/couriers/shadowfax/status-mapping";
import type { ShadowfaxWebhookPayload } from "@/lib/couriers/shadowfax/types";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/constants";

export async function POST(req: Request) {
  try {
    const payload: ShadowfaxWebhookPayload = await req.json();

    if (!payload.awb_number && !payload.order_id) {
      return NextResponse.json(
        { error: "Invalid payload: missing awb_number or order_id" },
        { status: 400 },
      );
    }

    const mappedStatus = mapShadowfaxStatus(payload.status || payload.event);

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const searchAwb = payload.awb_number || (payload as any).client_order_id || payload.order_id || "";

      // Find the shipment by AWB or orderNumber
      const { data: shipment } = await supabase
        .from("ecommerce_shipments")
        .select("id, order_id, shipment_status, shipping_charge, user_id")
        .or(`awb_number.eq.${searchAwb},tracking_number.eq.${searchAwb}`)
        .maybeSingle();

      if (shipment) {
        // Update shipment status
        await supabase
          .from("ecommerce_shipments")
          .update({
            shipment_status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", shipment.id);

        if (shipment.order_id) {
          await supabase
            .from("orders")
            .update({
              order_status: mappedStatus === "CANCELLED" ? "CANCELLED" : mappedStatus === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
              updated_at: new Date().toISOString(),
            })
            .eq("id", shipment.order_id);
        }
      }
    }

    return NextResponse.json({
      message: "Webhook processed successfully",
      status: "SUCCESS",
      mappedStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 500 },
    );
  }
}

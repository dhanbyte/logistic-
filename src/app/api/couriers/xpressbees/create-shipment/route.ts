import { NextResponse } from "next/server";
import { z } from "zod";
import { XpressbeesProvider } from "@/lib/couriers/xpressbees/provider";
import { createClient } from "@/lib/supabase/server";

const createShipmentSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  warehouseId: z.string(),
  pickupPincode: z.string().regex(/^[1-9][0-9]{5}$/),
  deliveryPincode: z.string().regex(/^[1-9][0-9]{5}$/),
  customerName: z.string().min(1),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/),
  customerAddress: z.string().min(1),
  customerCity: z.string().min(1),
  customerState: z.string().min(1),
  productName: z.string().min(1),
  productSku: z.string().optional(),
  quantity: z.number().int().positive(),
  paymentMode: z.enum(["PREPAID", "COD"]),
  orderAmount: z.number().positive(),
  codAmount: z.number().nonnegative(),
  weightKg: z.number().positive(),
  lengthCm: z.number().positive(),
  widthCm: z.number().positive(),
  heightCm: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    let userId: string | null = null;

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ status: false, message: "Unauthorized." }, { status: 401 });
      }
      userId = user.id;
    }

    const body = await request.json();
    const parsed = createShipmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: false,
          message: "Invalid shipment booking parameters.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Idempotency / Duplicate Booking Check
    if (supabase && userId) {
      const { data: existingShipment } = await supabase
        .from("ecommerce_shipments")
        .select("id, awb_number, label_url")
        .eq("order_id", parsed.data.orderId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingShipment) {
        return NextResponse.json(
          {
            status: false,
            message: `Order is already booked with AWB: ${existingShipment.awb_number}`,
            data: existingShipment,
          },
          { status: 409 },
        );
      }
    }

    const provider = new XpressbeesProvider();
    const result = await provider.createShipment({
      ...parsed.data,
      courierCode: "xpressbees",
    });

    return NextResponse.json({ status: true, data: result });
  } catch (error: any) {
    console.error("[API:xpressbees/create-shipment] Error:", error.message);
    return NextResponse.json(
      { status: false, message: error.message || "Failed to book Xpressbees shipment." },
      { status: 500 },
    );
  }
}

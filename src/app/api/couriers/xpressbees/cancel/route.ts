import { NextResponse } from "next/server";
import { z } from "zod";
import { XpressbeesProvider } from "@/lib/couriers/xpressbees/provider";
import { createClient } from "@/lib/supabase/server";

const cancelSchema = z.object({
  awb: z.string().min(5, "AWB number must be provided"),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ status: false, message: "Unauthorized." }, { status: 401 });
      }
    }

    const body = await request.json();
    const parsed = cancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: false, message: "Invalid AWB parameter.", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const provider = new XpressbeesProvider();
    const result = await provider.cancelShipment(parsed.data.awb);

    if (!result.success) {
      return NextResponse.json({ status: false, message: result.message }, { status: 400 });
    }

    // Update database status if connected
    if (supabase) {
      await supabase
        .from("ecommerce_shipments")
        .update({ shipment_status: "CANCELLED" as any })
        .eq("awb_number", parsed.data.awb);
    }

    return NextResponse.json({ status: true, message: result.message });
  } catch (error: any) {
    console.error("[API:xpressbees/cancel] Error:", error.message);
    return NextResponse.json(
      { status: false, message: error.message || "Failed to cancel Xpressbees shipment." },
      { status: 500 },
    );
  }
}

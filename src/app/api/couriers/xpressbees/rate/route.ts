import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateChargeableWeight } from "@/lib/calculations";
import { XpressbeesProvider } from "@/lib/couriers/xpressbees/provider";
import { createClient } from "@/lib/supabase/server";

const rateQuerySchema = z.object({
  pickupPincode: z.string().regex(/^[1-9][0-9]{5}$/),
  deliveryPincode: z.string().regex(/^[1-9][0-9]{5}$/),
  weightKg: z.number().positive(),
  paymentMode: z.enum(["PREPAID", "COD"]),
  declaredValue: z.number().nonnegative().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
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
    const parsed = rateQuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: false, message: "Invalid rate request parameters.", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { lengthCm = 10, widthCm = 10, heightCm = 10, weightKg, ...rest } = parsed.data;
    const weightCalc = calculateChargeableWeight(weightKg, { lengthCm, widthCm, heightCm });

    const provider = new XpressbeesProvider();
    const quote = await provider.calculateRate(
      {
        pickupPincode: rest.pickupPincode,
        deliveryPincode: rest.deliveryPincode,
        weightKg: weightCalc.chargeableWeightKg,
        paymentMode: rest.paymentMode,
        declaredValue: rest.declaredValue,
      },
      weightCalc,
    );

    if (!quote) {
      return NextResponse.json(
        { status: false, message: "Destination pincode not serviceable by Xpressbees." },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: true, data: quote });
  } catch (error: any) {
    console.error("[API:xpressbees/rate] Error:", error.message);
    return NextResponse.json(
      { status: false, message: "Failed to calculate Xpressbees rate." },
      { status: 500 },
    );
  }
}

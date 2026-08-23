import { NextResponse } from "next/server";
import { z } from "zod";
import { XpressbeesClient } from "@/lib/couriers/xpressbees/client";
import { createClient } from "@/lib/supabase/server";

const serviceabilitySchema = z.object({
  origin: z.string().regex(/^[1-9][0-9]{5}$/, "Origin PIN must be exactly 6 digits"),
  destination: z.string().regex(/^[1-9][0-9]{5}$/, "Destination PIN must be exactly 6 digits"),
  payment_type: z.enum(["cod", "prepaid"]),
  order_amount: z.union([z.number(), z.string()]),
  weight: z.union([z.number(), z.string()]).optional(),
  length: z.union([z.number(), z.string()]).optional(),
  breadth: z.union([z.number(), z.string()]).optional(),
  height: z.union([z.number(), z.string()]).optional(),
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
    const parsed = serviceabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: false,
          message: "Validation failed.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const client = new XpressbeesClient();
    const result = await client.getServiceabilityAndRates(parsed.data as any);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API:xpressbees/serviceability] Error:", error.message);
    return NextResponse.json(
      { status: false, message: "Failed to check Xpressbees serviceability." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { XpressbeesProvider } from "@/lib/couriers/xpressbees/provider";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ awb: string }> },
) {
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

    const { awb } = await params;
    if (!awb || awb.length < 5) {
      return NextResponse.json({ status: false, message: "Invalid AWB number." }, { status: 400 });
    }

    const provider = new XpressbeesProvider();
    const tracking = await provider.trackAwb(awb);

    return NextResponse.json({ status: true, data: tracking });
  } catch (error: any) {
    console.error("[API:xpressbees/track] Error:", error.message);
    return NextResponse.json(
      { status: false, message: error.message || "Failed to retrieve Xpressbees tracking info." },
      { status: 404 },
    );
  }
}

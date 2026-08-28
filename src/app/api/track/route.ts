import { NextRequest, NextResponse } from "next/server";
import { getPublicTrackingData } from "@/lib/data/tracking";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get("awb") || searchParams.get("id") || "";

    if (!awb || awb.trim().length === 0) {
      return NextResponse.json(
        { found: false, error: "Please provide a valid AWB or tracking number." },
        { status: 400 }
      );
    }

    const data = await getPublicTrackingData(awb);

    if (data.isNotFound) {
      return NextResponse.json({
        found: false,
        awb: awb.trim().toUpperCase(),
        error: `Shipment record not found for AWB ${awb.trim().toUpperCase()}. Please verify the number with your merchant or order confirmation.`,
      });
    }

    return NextResponse.json({
      found: true,
      awb: data.awbNumber,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { found: false, error: err.message || "Failed to fetch tracking data." },
      { status: 500 }
    );
  }
}

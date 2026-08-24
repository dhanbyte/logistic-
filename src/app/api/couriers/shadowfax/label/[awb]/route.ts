import { NextResponse } from "next/server";
import { ShadowfaxClient } from "@/lib/couriers/shadowfax/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ awb: string }> },
) {
  const { awb } = await params;

  try {
    const client = new ShadowfaxClient();
    if (client.isConfigured()) {
      const labelUrl = await client.generateLabel(awb, "pdf");
      if (labelUrl && labelUrl.startsWith("http")) {
        return NextResponse.redirect(labelUrl);
      }
    }
  } catch (error: any) {
    console.error("[Shadowfax.Label] Error fetching official label:", error.message);
  }

  // Fallback to printable label view if S3 PDF is preparing
  return NextResponse.redirect(new URL(`/shipments/${awb}/label`, request.url));
}

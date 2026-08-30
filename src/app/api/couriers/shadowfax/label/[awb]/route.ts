import { NextResponse } from "next/server";
import { ShadowfaxClient } from "@/lib/couriers/shadowfax/client";
import { getEffectiveSession } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ awb: string }> },
) {
  const { awb } = await params;
  const { searchParams } = new URL(request.url);
  const isDirectDownload = searchParams.get("download") !== "false";

  // 1. Try with primary Shadowfax Client (Air / Express)
  const clientTokens = [
    process.env.SHADOWFAX_TOKEN,
    process.env.SHADOWFAX_SURFACE_TOKEN,
  ].filter(Boolean) as string[];

  for (const token of clientTokens) {
    try {
      const client = new ShadowfaxClient({ token });
      if (client.isConfigured()) {
        const labelUrl = await client.generateLabel(awb, "pdf");
        if (labelUrl && labelUrl.startsWith("http")) {
          // Attempt to fetch the official PDF binary to serve directly
          try {
            const pdfResp = await fetch(labelUrl);
            if (pdfResp.ok) {
              const contentType = pdfResp.headers.get("content-type") || "";
              if (contentType.includes("pdf") || contentType.includes("octet-stream") || pdfResp.status === 200) {
                const pdfBuffer = await pdfResp.arrayBuffer();
                return new NextResponse(pdfBuffer, {
                  status: 200,
                  headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": isDirectDownload
                      ? `attachment; filename="Shadowfax-Label-${awb}.pdf"`
                      : `inline; filename="Shadowfax-Label-${awb}.pdf"`,
                    "Cache-Control": "public, max-age=86400",
                  },
                });
              }
            }
          } catch {
            // If fetch fails, redirect directly to S3 URL
          }

          return NextResponse.redirect(labelUrl);
        }
      }
    } catch (err: any) {
      console.warn(`[Shadowfax.Label] Live label fetch attempt for ${awb}:`, err.message);
    }
  }

  // 2. Try to fetch stored label_url from Supabase database
  try {
    const session = await getEffectiveSession();
    if (session) {
      const { supabase } = session;
      const { data: shipment } = await supabase
        .from("ecommerce_shipments")
        .select("label_url, awb_number, id")
        .or(`awb_number.eq.${awb},id.eq.${awb}`)
        .maybeSingle();

      if (shipment?.label_url && shipment.label_url.startsWith("http")) {
        try {
          const pdfResp = await fetch(shipment.label_url);
          if (pdfResp.ok) {
            const pdfBuffer = await pdfResp.arrayBuffer();
            return new NextResponse(pdfBuffer, {
              status: 200,
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": isDirectDownload
                  ? `attachment; filename="Shadowfax-Label-${shipment.awb_number || awb}.pdf"`
                  : `inline; filename="Shadowfax-Label-${shipment.awb_number || awb}.pdf"`,
                "Cache-Control": "public, max-age=86400",
              },
            });
          }
        } catch {
          // Redirect if binary fetch fails
        }
        return NextResponse.redirect(shipment.label_url);
      }
    }
  } catch (err) {
    console.error("[Shadowfax.Label] Database lookup failed:", err);
  }

  // 3. Fallback to printable web label if S3 URL is not yet generated
  return NextResponse.redirect(new URL(`/shipments/${awb}/label`, request.url));
}

import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const manifestId = filename.replace(/\.pdf$/i, "").trim();

  let shipments: any[] = [];
  let warehouseData: any = null;

  try {
    const session = await getEffectiveSession();
    if (session) {
      const { supabase, user } = session;

      const { data } = await supabase
        .from("ecommerce_shipments")
        .select(`
          awb_number,
          payment_mode,
          cod_amount,
          weight_kg,
          delivery_pincode,
          courier_provider:courier_providers(name),
          order:orders(
            order_number,
            customer:customers(full_name, city, phone)
          ),
          warehouse:warehouses(*)
        `)
        .eq("user_id", user.id)
        .limit(20);

      if (data && data.length > 0) {
        shipments = data;
        warehouseData = data[0]?.warehouse;
      }
    }
  } catch (err) {
    console.error("[ManifestRoute] Error querying manifest:", err);
  }

  const hubName = warehouseData?.warehouse_name || "Primary Fulfillment Hub";
  const hubAddress = warehouseData?.address_line1 || "Okhla Industrial Area, Phase III";
  const hubCity = warehouseData?.city || "New Delhi";
  const hubPin = warehouseData?.pincode || "110020";

  const rowsHtml = shipments.length
    ? shipments
        .map(
          (s, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${s.awb_number}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${s.order?.order_number || "ORD-001"}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${s.order?.customer?.full_name || "Customer"} (${s.order?.customer?.phone || ""})</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${s.delivery_pincode || "560001"}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${s.payment_mode}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">₹${s.payment_mode === "COD" ? s.cod_amount : 0}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">_______</td>
      </tr>`,
        )
        .join("")
    : `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">1</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${manifestId.startsWith("SFX") ? manifestId : `SFX-${manifestId}`}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">ORD-94812</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">Priya Sharma (9876543210)</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">560001</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">PREPAID</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">₹0</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">_______</td>
      </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Courier Pickup Manifest - ${manifestId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; padding: 24px; color: #0f172a; background: #f8fafc; }
    .no-print { display: flex; justify-content: space-between; max-width: 900px; margin: 0 auto 16px auto; }
    .manifest-card { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; padding: 24px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; }
    @media print { body { background: #fff; padding: 0; } .no-print { display: none; } .manifest-card { border: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <a href="/manifest" style="text-decoration:none; color:#475569; font-weight:bold; font-size:13px;">&larr; Back to Manifests</a>
    <button onclick="window.print()" style="background:#4f46e5; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Print Manifest</button>
  </div>
  <div class="manifest-card">
    <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:12px;">
      <div>
        <h1 style="font-size:20px; font-weight:900;">COURIER HANDOVER MANIFEST</h1>
        <p style="font-size:12px; color:#475569; margin-top:2px;">Pickup Origin: <strong>${hubName}</strong> (${hubAddress}, ${hubCity} - ${hubPin})</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:12px; font-weight:bold;">Manifest Ref: <span style="font-family:monospace;">${manifestId}</span></p>
        <p style="font-size:11px; color:#64748b;">Date: ${new Date().toLocaleDateString("en-IN")}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>AWB Number</th>
          <th>Order No</th>
          <th>Consignee</th>
          <th>PIN</th>
          <th>Payment</th>
          <th>COD (₹)</th>
          <th>Rider Sign</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div style="display:flex; justify-content:space-between; margin-top:36px; padding-top:16px; border-top:1px dashed #cbd5e1; font-size:12px;">
      <div>
        <p><strong>Seller / Warehouse Executive Sign:</strong></p>
        <p style="margin-top:24px; color:#64748b;">___________________________</p>
      </div>
      <div style="text-align:right;">
        <p><strong>Courier Rider / Feeder Executive Sign:</strong></p>
        <p style="margin-top:24px; color:#64748b;">___________________________</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

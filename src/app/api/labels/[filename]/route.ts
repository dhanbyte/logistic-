import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/supabase/server";
import { formatINR } from "@/lib/calculations";
import { ShadowfaxClient } from "@/lib/couriers/shadowfax/client";
import { XpressbeesClient } from "@/lib/couriers/xpressbees/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  // Clean AWB number (remove .pdf if present)
  const awb = filename.replace(/\.pdf$/i, "").trim();

  // 1. Try to fetch direct official label from Shadowfax API if this is a Shadowfax AWB
  if (awb.startsWith("SFX") || awb.startsWith("SHADOWFAX")) {
    try {
      const sfxClient = new ShadowfaxClient();
      if (sfxClient.isConfigured()) {
        const officialLabelUrl = await sfxClient.generateLabel(awb, "pdf");
        if (officialLabelUrl && officialLabelUrl.startsWith("http")) {
          return NextResponse.redirect(officialLabelUrl);
        }
      }
    } catch (err: any) {
      console.warn(`[Shadowfax.Label] Live API check for ${awb}:`, err.message);
    }
  }

  // 3. Try to find the shipment in the database
  let shipmentData: any = null;
  let orderData: any = null;
  let customerData: any = null;
  let warehouseData: any = null;

  try {
    const session = await getEffectiveSession();
    if (session) {
      const { supabase } = session;

      const { data: shipment } = await supabase
        .from("ecommerce_shipments")
        .select(`
          *,
          courier_provider:courier_providers(name, code, logo_url),
          warehouse:warehouses(*),
          order:orders(
            *,
            customer:customers(*),
            items:order_items(*)
          )
        `)
        .eq("awb_number", awb)
        .maybeSingle();

      if (shipment) {
        shipmentData = shipment;
        orderData = shipment.order;
        customerData = shipment.order?.customer;
        warehouseData = shipment.warehouse;

        // If the database already stores the official carrier S3/API label URL, redirect directly
        if (shipment.label_url && shipment.label_url.startsWith("http")) {
          return NextResponse.redirect(shipment.label_url);
        }
      }
    }
  } catch (err) {
    console.error("[LabelRoute] Error querying shipment:", err);
  }

  // 4. Standard Direct Shadowfax Thermal Label Layout
  const carrierName = shipmentData?.courier_provider?.name || (awb.startsWith("SFX") ? "Shadowfax Express Logistics" : awb.startsWith("XPB") || awb.startsWith("XB") ? "Xpressbees Logistics" : "Shadowfax Forward");
  const orderNumber = orderData?.order_number || `ORD-${awb.slice(-6)}`;
  const paymentMode = shipmentData?.payment_mode || (awb.includes("COD") ? "COD" : "PREPAID");
  const isCod = paymentMode === "COD";
  const amount = isCod ? (shipmentData?.cod_amount || 1499) : (orderData?.order_amount || 1499);
  const routingCode = shipmentData?.routing_code || `${(shipmentData?.delivery_pincode || "380005").slice(0, 3)}-SFX`;

  const consigneeName = customerData?.full_name || "Dhananjay Singh";
  const consigneeAddress1 = customerData?.address_line1 || "Vrindavan residency Motera";
  const consigneeAddress2 = customerData?.address_line2 || "";
  const consigneeCity = customerData?.city || "Ahmedabad";
  const consigneeState = customerData?.state || "Gujarat";
  const consigneePin = customerData?.pincode || shipmentData?.delivery_pincode || "380005";
  const consigneePhone = customerData?.phone || "9157499884";

  const shipperName = warehouseData?.warehouse_name || "Primary Fulfillment Hub";
  const shipperAddress = warehouseData?.address_line1 || "Vrindavan residency Motera";
  const shipperCity = warehouseData?.city || "Ahmedabad";
  const shipperState = warehouseData?.state || "Gujarat";
  const shipperPin = warehouseData?.pincode || shipmentData?.pickup_pincode || "380005";
  const shipperPhone = warehouseData?.contact_phone || "9157499884";

  const weightKg = shipmentData?.weight_kg || 0.5;
  const chargeableWeightKg = shipmentData?.chargeable_weight_kg || 0.5;

  const items = orderData?.items?.length
    ? orderData.items.map((i: any) => `${i.quantity}x ${i.product_name} (${i.sku || "SKU-01"})`).join("<br/>")
    : "1x Standard Apparel / Merchandise";

  // Render Official-Style 4x6 Thermal Shipping Label (Shadowfax Format)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shadowfax Shipping Label - ${awb}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    .no-print {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 400px;
      margin-bottom: 12px;
    }
    .btn {
      background: #4f46e5;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-back {
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      display: inline-block;
    }
    .label-container {
      width: 100%;
      max-width: 400px;
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 6px;
      padding: 14px;
      color: #0f172a;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
    }
    .carrier-title {
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .carrier-sub {
      font-size: 9px;
      font-weight: 700;
      color: #475569;
    }
    .routing-box {
      border: 2px solid #0f172a;
      padding: 2px 8px;
      font-weight: 900;
      font-size: 13px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .barcode-section {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding: 12px 0 8px 0;
    }
    .barcode-lines {
      display: flex;
      justify-content: center;
      height: 48px;
      gap: 2px;
      margin: 0 auto;
    }
    .bar { background: #000; height: 100%; }
    .awb-text {
      font-family: monospace;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 2px;
      margin-top: 4px;
    }
    .order-ref {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding: 8px 0;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-weight: 900;
      font-size: 12px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-cod { background: #0f172a; color: #ffffff; }
    .badge-prepaid { border: 1.5px solid #0f172a; color: #0f172a; }
    .amount { font-size: 15px; font-weight: 900; }
    .consignee-box {
      border-bottom: 2px solid #0f172a;
      padding: 8px 0;
      font-size: 12px;
    }
    .consignee-title {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .pin-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 2px 6px;
      font-weight: 900;
      font-size: 11px;
      border-radius: 3px;
    }
    .specs-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      font-size: 10px;
      padding: 6px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .items-section {
      border-bottom: 2px solid #0f172a;
      padding: 6px 0 8px 0;
      font-size: 10px;
    }
    .shipper-box {
      padding-top: 8px;
      font-size: 9px;
      color: #475569;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .no-print { display: none; }
      .label-container {
        border: none;
        box-shadow: none;
        width: 4in;
        min-height: 6in;
        padding: 4px;
      }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <a href="/shipments" class="btn-back">&larr; Back to Shipments</a>
    <button onclick="window.print()" class="btn">🖨️ Print Label (4x6)</button>
  </div>

  <div class="label-container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="carrier-title">SHADOWFAX FORWARD</div>
        <div class="carrier-sub">DIRECT B2C EXPRESS LOGISTICS NETWORK</div>
      </div>
      <div class="routing-box">${routingCode}</div>
    </div>

    <!-- Barcode -->
    <div class="barcode-section">
      <div class="barcode-lines">
        ${Array.from({ length: 42 }).map((_, i) => `<div class="bar" style="width: ${i % 3 === 0 ? "3px" : i % 5 === 0 ? "2px" : "1.5px"}; margin: 0 1px;"></div>`).join("")}
      </div>
      <div class="awb-text">AWB: ${awb}</div>
      <div class="order-ref">Order Ref: ${orderNumber}</div>
    </div>

    <!-- Payment Row -->
    <div class="payment-row">
      <div>
        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Payment Mode</div>
        <div class="badge ${isCod ? "badge-cod" : "badge-prepaid"}">${paymentMode}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">${isCod ? "COD Collectible" : "Total Amount"}</div>
        <div class="amount">${formatINR(amount)}</div>
      </div>
    </div>

    <!-- Deliver To -->
    <div class="consignee-box">
      <div class="consignee-title">Deliver To (Consignee):</div>
      <div style="font-weight: 900; font-size: 13px;">${consigneeName}</div>
      <div style="margin-top: 2px;">${consigneeAddress1}${consigneeAddress2 ? `, ${consigneeAddress2}` : ""}</div>
      <div style="font-weight: 700; margin-top: 2px;">${consigneeCity}, ${consigneeState}</div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        <span class="pin-badge">PIN: ${consigneePin}</span>
        <span style="font-weight: 700; font-size: 11px;">Ph: ${consigneePhone}</span>
      </div>
    </div>

    <!-- Package Specs -->
    <div class="specs-row">
      <div><span style="color:#64748b;">Weight:</span> <strong>${weightKg} kg</strong></div>
      <div><span style="color:#64748b;">Chargeable:</span> <strong>${chargeableWeightKg} kg</strong></div>
      <div><span style="color:#64748b;">Dimensions:</span> <strong>15x10x5 cm</strong></div>
    </div>

    <!-- Items -->
    <div class="items-section">
      <div style="font-weight: 800; margin-bottom: 2px;">Items in Package:</div>
      <div style="color: #334155; line-height: 1.4;">${items}</div>
    </div>

    <!-- Shipper / Return Details -->
    <div class="shipper-box">
      <div style="font-weight: 900; text-transform: uppercase; color: #0f172a; margin-bottom: 2px;">Return To / Shipped By:</div>
      <div style="font-weight: 800; color: #0f172a;">${shipperName}</div>
      <div>${shipperAddress}, ${shipperCity}, ${shipperState} - <strong>${shipperPin}</strong></div>
      <div>Ph: ${shipperPhone} | Direct Courier Partner: <strong>Shadowfax Technologies</strong></div>
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

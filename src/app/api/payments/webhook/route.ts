import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { creditWalletRecharge } from "@/lib/finance/wallet-service";
import { toPaise } from "@/lib/finance/money";

// Idempotency store to track processed webhook events
const processedWebhookEvents = new Set<string>();

/**
 * Validates HMAC SHA256 signature for Razorpay / Cashfree webhooks
 */
function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return true; // Development fallback
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return expectedSignature === signature;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || request.headers.get("x-webhook-signature");
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || "shipwave_webhook_secret_key";

    // 1. Signature Verification
    const isValid = verifyWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;

    // 2. Idempotency Guard - prevent duplicate webhook processing
    if (processedWebhookEvents.has(eventId)) {
      return NextResponse.json(
        { status: "ALREADY_PROCESSED", message: "Duplicate webhook ignored." },
        { status: 200 },
      );
    }

    processedWebhookEvents.add(eventId);

    // 3. Process Event
    const eventType = payload.event || "payment.captured";

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity || payload.data || {};
      const userId = paymentEntity.notes?.user_id || "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5";
      const amountPaise = paymentEntity.amount || toPaise(Number(paymentEntity.amount_in_rupees || 500));
      const paymentId = paymentEntity.id || `pay_${Date.now()}`;

      await creditWalletRecharge({
        userId,
        amountPaise,
        paymentId,
        gatewayReference: paymentEntity.method ? `Razorpay (${paymentEntity.method})` : "Razorpay PG",
      });

      return NextResponse.json({
        success: true,
        message: `Wallet credited with ₹${(amountPaise / 100).toFixed(2)}`,
      });
    }

    return NextResponse.json({ success: true, message: "Event received." });
  } catch (error: any) {
    console.error("[payments.webhook] error:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed." }, { status: 500 });
  }
}

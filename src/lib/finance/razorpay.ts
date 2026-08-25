import crypto from "crypto";

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return {
    keyId,
    keySecret,
    isConfigured: Boolean(keyId && keySecret),
  };
}

export function isRazorpayConfigured(): boolean {
  const { isConfigured } = getRazorpayCredentials();
  return isConfigured;
}

/**
 * Creates an official order on Razorpay PG
 */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}): Promise<{ ok: true; order: RazorpayOrderResponse } | { ok: false; error: string }> {
  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();

  if (!isConfigured || !keyId || !keySecret) {
    return { ok: false, error: "Razorpay keys are not configured in environment variables." };
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: params.currency || "INR",
        receipt: params.receipt || `rcpt_${Date.now()}`,
        notes: params.notes || {},
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error?.description || data.message || "Failed to create Razorpay order.",
      };
    }

    return { ok: true, order: data as RazorpayOrderResponse };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error while calling Razorpay API." };
  }
}

/**
 * Validates Razorpay Payment Signature for client-side checkout verification
 */
export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials();
  if (!keySecret) return false;

  try {
    const text = `${params.orderId}|${params.paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");
    return generatedSignature === params.signature;
  } catch {
    return false;
  }
}

/**
 * Validates HMAC SHA256 signature for Razorpay Webhooks
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null,
  webhookSecret?: string
): boolean {
  const secret = webhookSecret || process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!signature || !secret) return false;

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

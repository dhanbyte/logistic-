import { describe, expect, it } from "vitest";
import crypto from "crypto";
import {
  createRazorpayOrder,
  getRazorpayCredentials,
  isRazorpayConfigured,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "./razorpay";

describe("Razorpay Payment Gateway Integration", () => {
  it("detects configured Razorpay credentials", () => {
    const creds = getRazorpayCredentials();
    expect(creds.isConfigured).toBe(true);
    expect(creds.keyId).toBe("rzp_live_TTzC0vO6OlK3Co");
    expect(creds.keySecret).toBe("89WVdnjrvMlUB7l5Gf5QE85E");
    expect(isRazorpayConfigured()).toBe(true);
  });

  it("verifies valid HMAC SHA256 payment signature", () => {
    const orderId = "order_test_98765";
    const paymentId = "pay_test_12345";
    const secret = "89WVdnjrvMlUB7l5Gf5QE85E";

    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const result = verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature: validSignature,
    });
    expect(result).toBe(true);

    const invalidResult = verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature: "invalid_tampered_signature",
    });
    expect(invalidResult).toBe(false);
  });

  it("verifies webhook HMAC SHA256 signature", () => {
    const rawBody = JSON.stringify({ event: "payment.captured", id: "evt_123" });
    const secret = "89WVdnjrvMlUB7l5Gf5QE85E";

    const validWebhookSig = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    expect(verifyRazorpayWebhookSignature(rawBody, validWebhookSig, secret)).toBe(true);
    expect(verifyRazorpayWebhookSignature(rawBody, "wrong_sig", secret)).toBe(false);
  });


  it("creates a live test order via Razorpay API", async () => {
    const res = await createRazorpayOrder({
      amountPaise: 10000, // ₹100
      currency: "INR",
      receipt: `test_rcpt_${Date.now()}`,
      notes: { test: "antigravity_verification" },
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.order.id).toMatch(/^order_/);
      expect(res.order.amount).toBe(10000);
      expect(res.order.currency).toBe("INR");
      expect(res.order.status).toBe("created");
    }
  });
});

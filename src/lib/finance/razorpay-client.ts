"use client";

import { toast } from "sonner";

export interface RazorpayCheckoutOptions {
  amount: number; // in Rupees
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess: (paymentData: { paymentId: string; orderId: string; newBalance?: number }) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

/**
 * Dynamically loads Razorpay checkout.js script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Initiates standard Razorpay PG checkout modal
 */
export async function launchRazorpayRecharge(options: RazorpayCheckoutOptions): Promise<boolean> {
  try {
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Razorpay SDK could not be loaded. Please check your internet connection.");
      options.onError?.("Razorpay SDK load failed");
      return false;
    }

    // 1. Create order on server
    const orderRes = await fetch("/api/payments/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: options.amount,
        userId: options.userId || "default-user",
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.order) {
      const err = orderData.error || "Failed to initialize Razorpay payment order.";
      toast.error(err);
      options.onError?.(err);
      return false;
    }

    const { order, keyId } = orderData;

    // 2. Configure Razorpay Checkout Modal
    const razorpayOptions = {
      key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_TTzC0vO6OlK3Co",
      amount: order.amount,
      currency: order.currency || "INR",
      name: "ShipWave Logistics",
      description: `Wallet Recharge of ₹${options.amount.toLocaleString("en-IN")}`,
      image: "https://cdn-icons-png.flaticon.com/512/9561/9561688.png",
      order_id: order.id,
      prefill: {
        name: options.userName || "Merchant Seller",
        email: options.userEmail || "seller@shipwave.me",
        contact: options.userPhone || "9876543210",
      },
      theme: {
        color: "#4f46e5", // Indigo theme
      },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        try {
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: options.amount,
              userId: options.userId,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            options.onSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            });
          } else {
            toast.error(verifyData.error || "Payment verification failed.");
            options.onError?.(verifyData.error);
          }
        } catch (err: any) {
          toast.error(err.message || "Verification request failed.");
          options.onError?.(err.message);
        }
      },
      modal: {
        ondismiss: function () {
          options.onClose?.();
        },
      },
    };

    const rzp = new (window as any).Razorpay(razorpayOptions);
    rzp.on("payment.failed", function (response: any) {
      toast.error(`Payment failed: ${response.error?.description || "Transaction declined"}`);
      options.onError?.(response.error?.description);
    });

    rzp.open();
    return true;
  } catch (error: any) {
    console.error("[launchRazorpayRecharge] error:", error);
    toast.error(error.message || "An unexpected error occurred.");
    options.onError?.(error.message);
    return false;
  }
}

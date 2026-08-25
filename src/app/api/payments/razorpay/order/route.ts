import { NextResponse, type NextRequest } from "next/server";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/finance/razorpay";
import { toPaise } from "@/lib/finance/money";

export async function POST(request: NextRequest) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Razorpay is not configured on the server." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const amountRupees = Number(body.amount);

    if (!amountRupees || isNaN(amountRupees) || amountRupees < 1) {
      return NextResponse.json(
        { error: "Please specify a valid recharge amount (min ₹1)." },
        { status: 400 }
      );
    }

    const amountPaise = toPaise(amountRupees);
    const result = await createRazorpayOrder({
      amountPaise,
      currency: "INR",
      receipt: `recharge_${Date.now()}`,
      notes: {
        userId: body.userId || "guest",
        purpose: "wallet_recharge",
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("[api.payments.razorpay.order] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}

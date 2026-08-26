import { NextResponse, type NextRequest } from "next/server";
import { verifyRazorpayPaymentSignature } from "@/lib/finance/razorpay";
import { creditWalletRecharge } from "@/lib/finance/wallet-service";
import { toPaise, toRupees } from "@/lib/finance/money";
import { createServiceClient, getEffectiveSession, FALLBACK_USER_ID } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, userId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature. Verification failed." },
        { status: 400 }
      );
    }

    const session = await getEffectiveSession();
    const targetUserId =
      session?.user?.id ||
      (userId && userId !== "default-user" && userId !== "current-user" ? userId : FALLBACK_USER_ID);

    const amountRupees = Number(amount) || 0;
    const amountPaise = toPaise(amountRupees);

    if (amountPaise <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    const rechargeResult = await creditWalletRecharge({
      userId: targetUserId,
      amountPaise,
      paymentId: razorpay_payment_id,
      gatewayReference: `Razorpay (${razorpay_order_id})`,
    });

    const newBalanceRupees = toRupees(rechargeResult.newBalancePaise);

    return NextResponse.json({
      success: true,
      message: "Payment verified and wallet credited successfully.",
      paymentId: razorpay_payment_id,
      newBalance: newBalanceRupees,
      userId: targetUserId,
    });
  } catch (error: any) {
    console.error("[api.payments.razorpay.verify] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify Razorpay payment." },
      { status: 500 }
    );
  }
}

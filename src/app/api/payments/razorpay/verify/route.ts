import { NextResponse, type NextRequest } from "next/server";
import { verifyRazorpayPaymentSignature } from "@/lib/finance/razorpay";
import { creditWalletRecharge } from "@/lib/finance/wallet-service";
import { toPaise, toRupees } from "@/lib/finance/money";
import { getEffectiveSession } from "@/lib/supabase/server";
import { sendMetaConversionEvent } from "@/lib/meta-conversions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // Require authenticated session — no fallback allowed
    const session = await getEffectiveSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in before making a payment." },
        { status: 401 }
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

    const amountRupees = Number(amount) || 0;
    const amountPaise = toPaise(amountRupees);

    if (amountPaise <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    // Always credit the currently authenticated user — no fallback user IDs
    const targetUserId = session.user.id;

    const rechargeResult = await creditWalletRecharge({
      userId: targetUserId,
      amountPaise,
      paymentId: razorpay_payment_id,
      gatewayReference: `Razorpay (${razorpay_order_id})`,
    });

    const newBalanceRupees = toRupees(rechargeResult.newBalancePaise);

    // Fire Meta Conversions API Purchase Event
    sendMetaConversionEvent({
      eventName: "Purchase",
      eventId: razorpay_payment_id,
      userData: {
        email: session.user.email,
        phone: (session.user as any).phone,
      },
      customData: {
        currency: "INR",
        value: amountRupees,
        order_id: razorpay_payment_id,
        content_name: "Prepaid Shipping Wallet Recharge",
      },
    }).catch((capiErr) => console.error("[Meta CAPI Purchase Error]", capiErr));

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

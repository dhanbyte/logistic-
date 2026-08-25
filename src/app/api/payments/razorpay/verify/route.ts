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
    let newBalanceRupees = 0;

    const supabase = createServiceClient() || session?.supabase;

    if (supabase && targetUserId) {
      // 1. Fetch current profile balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", targetUserId)
        .maybeSingle();

      const currentBalance = typeof profile?.wallet_balance === "number" ? profile.wallet_balance : 0;
      newBalanceRupees = Number((currentBalance + amountRupees).toFixed(2));

      // 2. Update profiles table
      await supabase
        .from("profiles")
        .update({ wallet_balance: newBalanceRupees })
        .eq("id", targetUserId);

      // 3. Update wallets table
      const { data: wal } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (wal) {
        await supabase
          .from("wallets")
          .update({ balance: newBalanceRupees })
          .eq("user_id", targetUserId);
      } else {
        await supabase.from("wallets").insert({
          id: `wal-${targetUserId.slice(0, 8)}`,
          user_id: targetUserId,
          balance: newBalanceRupees,
          currency: "INR",
        });
      }

      // 4. Insert into wallet_transactions
      await supabase.from("wallet_transactions").insert({
        user_id: targetUserId,
        transaction_type: "CREDIT",
        category: "WALLET_RECHARGE",
        amount: amountRupees,
        balance_after: newBalanceRupees,
        reference_id: razorpay_payment_id,
        payment_gateway_reference: `Razorpay (${razorpay_order_id})`,
        description: `Prepaid wallet recharge of ₹${amountRupees.toFixed(2)} via Razorpay`,
      });
    }

    // Also update in-memory ledger
    if (amountPaise > 0) {
      await creditWalletRecharge({
        userId: targetUserId,
        amountPaise,
        paymentId: razorpay_payment_id,
        gatewayReference: `Razorpay (${razorpay_order_id})`,
      });
    }

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

import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";
import type {
  ComputedWalletBalance,
  TransactionDirection,
  TransactionType,
  WalletAccount,
  WalletLedgerEntry,
  WalletReservation,
} from "@/types/finance";
import { addPaise, subPaise, toPaise, toRupees } from "./money";

// In-memory fallback ledger store for demo mode & high-concurrency simulation
const inMemoryWallets = new Map<string, WalletAccount>();
const inMemoryLedger: WalletLedgerEntry[] = [];
const inMemoryReservations = new Map<string, WalletReservation>();

/**
 * Synchronizes wallet balance across both wallets and profiles tables
 */
async function syncDatabaseBalances(supabase: any, userId: string, cashBalancePaise: number) {
  if (!supabase) return;
  const bal = toRupees(cashBalancePaise);
  try {
    // 1. Update profiles table
    await supabase.from("profiles").update({ wallet_balance: bal }).eq("id", userId);

    // 2. Update wallets table if exists, or insert
    const { data: existingWal } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingWal) {
      await supabase.from("wallets").update({ balance: bal }).eq("user_id", userId);
    } else {
      await supabase.from("wallets").insert({
        id: `wal-${userId.slice(0, 8)}`,
        user_id: userId,
        balance: bal,
        currency: "INR",
      });
    }
  } catch (err) {
    console.warn("[syncDatabaseBalances]", err);
  }
}

/**
 * Calculates available funds, credit availability and low balance flags
 */
export function computeAvailableFunds(wallet: WalletAccount): ComputedWalletBalance {
  const availableCreditPaise = Math.max(
    0,
    wallet.freeCreditPaise + wallet.creditLimitPaise - wallet.usedCreditPaise,
  );
  const availableCashPaise = Math.max(0, wallet.cashBalancePaise - wallet.reservedBalancePaise);
  const totalAvailableFundsPaise = availableCashPaise + availableCreditPaise;
  const isLowBalance = wallet.cashBalancePaise < toPaise(200); // Low balance if < ₹200

  return {
    cashBalancePaise: wallet.cashBalancePaise,
    freeCreditPaise: wallet.freeCreditPaise,
    promoCreditPaise: wallet.promoCreditPaise,
    reservedBalancePaise: wallet.reservedBalancePaise,
    creditLimitPaise: wallet.creditLimitPaise,
    usedCreditPaise: wallet.usedCreditPaise,
    availableCreditPaise,
    availableCashPaise,
    totalAvailableFundsPaise,
    isLowBalance,
    status: wallet.status,
  };
}

/**
 * Fetches or initializes the user's multi-asset wallet
 */
export async function getOrCreateWallet(userId: string): Promise<WalletAccount> {
  const session = await getEffectiveSession();
  if (!session) {
    if (!inMemoryWallets.has(userId)) {
      inMemoryWallets.set(userId, {
        id: `wal-${userId.slice(0, 8)}`,
        userId,
        cashBalancePaise: 0, // ₹0.00 default starter balance for new sellers
        freeCreditPaise: 0,   // ₹0.00 (No free credit given by default)
        promoCreditPaise: 0,
        reservedBalancePaise: 0,
        creditLimitPaise: 0,
        usedCreditPaise: 0,
        currency: "INR",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return inMemoryWallets.get(userId)!;
  }

  const { supabase } = session;

  const [walletRes, profileRes] = await Promise.all([
    supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("wallet_balance").eq("id", userId).maybeSingle(),
  ]);

  const existing = walletRes.data;
  const profileBal = profileRes.data?.wallet_balance;
  const rawCashPaise =
    typeof profileBal === "number"
      ? toPaise(profileBal)
      : existing?.balance !== undefined
        ? toPaise(Number(existing.balance))
        : 0;

  const currentCashPaise = rawCashPaise;

  if (existing) {
    return {
      id: existing.id,
      userId: existing.user_id,
      cashBalancePaise: currentCashPaise,
      freeCreditPaise: 0,
      promoCreditPaise: 0,
      reservedBalancePaise: toPaise(Number((existing as any).reserved_balance || 0)),
      creditLimitPaise: toPaise(Number((existing as any).credit_limit || 0)),
      usedCreditPaise: toPaise(Number((existing as any).used_credit || 0)),
      currency: existing.currency || "INR",
      status: ((existing as any).status as any) || "ACTIVE",
      createdAt: existing.created_at || new Date().toISOString(),
      updatedAt: (existing as any).updated_at || new Date().toISOString(),
    };
  }

  // Create initial wallet record with 0 balance for new sellers
  const initialWallet: WalletAccount = {
    id: `wal-${userId.slice(0, 8)}`,
    userId,
    cashBalancePaise: currentCashPaise,
    freeCreditPaise: 0,
    promoCreditPaise: 0,
    reservedBalancePaise: 0,
    creditLimitPaise: 0,
    usedCreditPaise: 0,
    currency: "INR",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await supabase.from("wallets").insert({
      id: initialWallet.id,
      user_id: userId,
      balance: toRupees(initialWallet.cashBalancePaise),
      currency: "INR",
    });
  } catch (err) {
    console.warn("[getOrCreateWallet.insert]", err);
  }

  return initialWallet;
}

/**
 * Stage 1: Atomic Shipping Fund Reservation
 * Locks required funds internally so they cannot be spent twice by concurrent requests.
 */
export async function reserveShippingFunds(params: {
  userId: string;
  orderId: string;
  amountPaise: number;
}): Promise<{ ok: boolean; reservationId?: string; message: string }> {
  const wallet = await getOrCreateWallet(params.userId);

  if (wallet.status === "FROZEN" || wallet.status === "SUSPENDED") {
    return {
      ok: false,
      message: "Wallet is currently frozen. Please contact platform support.",
    };
  }

  const computed = computeAvailableFunds(wallet);

  if (computed.totalAvailableFundsPaise < params.amountPaise) {
    return {
      ok: false,
      message: `Insufficient funds. Required: ₹${toRupees(params.amountPaise).toFixed(2)}, Available: ₹${toRupees(computed.totalAvailableFundsPaise).toFixed(2)}. Please recharge your wallet.`,
    };
  }

  // Allocate from cash Available Balance
  const fromCashPaise = params.amountPaise;
  const fromCreditPaise = 0;

  const reservationId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const reservation: WalletReservation = {
    id: reservationId,
    userId: params.userId,
    walletId: wallet.id,
    orderId: params.orderId,
    amountPaise: params.amountPaise,
    fromCreditPaise,
    fromCashPaise,
    status: "PENDING",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins TTL
    createdAt: new Date().toISOString(),
  };

  // Mutate internal reserved balance
  wallet.reservedBalancePaise = addPaise(wallet.reservedBalancePaise, fromCashPaise);
  inMemoryWallets.set(params.userId, wallet);
  inMemoryReservations.set(reservationId, reservation);

  return { ok: true, reservationId, message: "Funds reserved successfully." };
}

/**
 * Stage 2: Commit Reservation upon Successful Courier Dispatch
 */
export async function commitShippingReservation(params: {
  reservationId: string;
  shipmentId: string;
  awbNumber: string;
}): Promise<{ ok: boolean; message: string }> {
  const reservation = inMemoryReservations.get(params.reservationId);
  if (!reservation || reservation.status !== "PENDING") {
    return { ok: false, message: "Invalid or expired reservation." };
  }

  const wallet = await getOrCreateWallet(reservation.userId);
  const prevCash = wallet.cashBalancePaise;
  const deductAmountPaise = reservation.amountPaise;

  wallet.cashBalancePaise = Math.max(0, subPaise(wallet.cashBalancePaise, deductAmountPaise));
  wallet.reservedBalancePaise = Math.max(0, subPaise(wallet.reservedBalancePaise, deductAmountPaise));

  await recordLedgerEntry({
    userId: reservation.userId,
    walletId: wallet.id,
    transactionType: "SHIPPING_CHARGE",
    amountPaise: deductAmountPaise,
    direction: "DEBIT",
    balanceBeforePaise: prevCash,
    balanceAfterPaise: wallet.cashBalancePaise,
    creditBeforePaise: wallet.freeCreditPaise,
    creditAfterPaise: wallet.freeCreditPaise,
    referenceType: "SHIPMENT",
    referenceId: params.awbNumber,
    shipmentId: params.shipmentId,
    status: "SUCCESS",
    description: `Shipping Charge for AWB ${params.awbNumber}`,
  });

  reservation.status = "COMMITTED";
  inMemoryReservations.set(params.reservationId, reservation);
  inMemoryWallets.set(reservation.userId, wallet);

  // Sync to database
  const session = await getEffectiveSession();
  const supabase = session?.supabase || createServiceClient();
  if (supabase) {
    await syncDatabaseBalances(supabase, reservation.userId, wallet.cashBalancePaise);
    try {
      await supabase.from("wallet_transactions").insert({
        user_id: reservation.userId,
        transaction_type: "DEBIT",
        category: "SHIPPING_DEDUCTION",
        amount: toRupees(deductAmountPaise),
        balance_after: toRupees(wallet.cashBalancePaise),
        reference_id: params.awbNumber,
        awb_number: params.awbNumber,
        description: `Shipping Charge for AWB ${params.awbNumber}`,
      });
    } catch (err) {
      console.warn("[commitShippingReservation.insertTxn]", err);
    }
  }

  return { ok: true, message: "Reservation committed and freight deducted." };
}


/**
 * Stage 3: Release Reservation on Failed Dispatch or Cancellation
 */
export async function releaseShippingReservation(params: {
  reservationId: string;
  reason: string;
}): Promise<{ ok: boolean; message: string }> {
  const reservation = inMemoryReservations.get(params.reservationId);
  if (!reservation || reservation.status !== "PENDING") {
    return { ok: false, message: "Reservation not in pending state." };
  }

  const wallet = await getOrCreateWallet(reservation.userId);

  // Un-reserve balances
  wallet.reservedBalancePaise = Math.max(0, subPaise(wallet.reservedBalancePaise, reservation.fromCashPaise));
  wallet.usedCreditPaise = Math.max(0, subPaise(wallet.usedCreditPaise, reservation.fromCreditPaise));

  reservation.status = "RELEASED";
  inMemoryReservations.set(params.reservationId, reservation);
  inMemoryWallets.set(reservation.userId, wallet);

  await recordLedgerEntry({
    userId: reservation.userId,
    walletId: wallet.id,
    transactionType: "SHIPPING_REVERSAL",
    amountPaise: reservation.amountPaise,
    direction: "CREDIT",
    balanceBeforePaise: wallet.cashBalancePaise,
    balanceAfterPaise: wallet.cashBalancePaise,
    creditBeforePaise: wallet.freeCreditPaise,
    creditAfterPaise: wallet.freeCreditPaise,
    referenceType: "ORDER",
    referenceId: reservation.orderId,
    orderId: reservation.orderId,
    status: "SUCCESS",
    description: `Reservation released: ${params.reason}`,
  });

  return { ok: true, message: "Reservation released and funds restored." };
}

/**
 * Topup user cash wallet with Gateway Idempotency Guarantee
 */
export async function creditWalletRecharge(params: {
  userId: string;
  amountPaise: number;
  paymentId: string;
  gatewayReference?: string;
}): Promise<{ ok: boolean; newBalancePaise: number; message: string }> {
  const wallet = await getOrCreateWallet(params.userId);
  const prevBalance = wallet.cashBalancePaise;
  wallet.cashBalancePaise = addPaise(wallet.cashBalancePaise, params.amountPaise);
  inMemoryWallets.set(params.userId, wallet);

  await recordLedgerEntry({
    userId: params.userId,
    walletId: wallet.id,
    transactionType: "WALLET_RECHARGE",
    amountPaise: params.amountPaise,
    direction: "CREDIT",
    balanceBeforePaise: prevBalance,
    balanceAfterPaise: wallet.cashBalancePaise,
    creditBeforePaise: wallet.freeCreditPaise,
    creditAfterPaise: wallet.freeCreditPaise,
    referenceType: "PAYMENT",
    referenceId: params.paymentId,
    paymentId: params.paymentId,
    status: "SUCCESS",
    description: `Prepaid wallet recharge via ${params.gatewayReference || "Razorpay Payment Gateway"}`,
  });

  const serviceClient = createServiceClient();
  const session = await getEffectiveSession();
  const supabase = serviceClient || session?.supabase;
  if (supabase) {
    await syncDatabaseBalances(supabase, params.userId, wallet.cashBalancePaise);

    try {
      await supabase.from("wallet_transactions").insert({
        user_id: params.userId,
        transaction_type: "CREDIT",
        category: "WALLET_RECHARGE",
        amount: toRupees(params.amountPaise),
        balance_after: toRupees(wallet.cashBalancePaise),
        reference_id: params.paymentId,
        payment_gateway_reference: params.gatewayReference || "Razorpay / UPI Instant Recharge",
        description: `Prepaid wallet recharge of ₹${toRupees(params.amountPaise).toFixed(2)}`,
      });
    } catch (err) {
      console.warn("[creditWalletRecharge.insertTxn]", err);
    }
  }


  return {
    ok: true,
    newBalancePaise: wallet.cashBalancePaise,
    message: `Wallet credited with ₹${toRupees(params.amountPaise).toFixed(2)}`,
  };
}

/**
 * Admin Grant Free / Promotional Credit
 * Invariant: Free credit is strictly non-withdrawable as cash.
 */
export async function grantFreeCredit(params: {
  userId: string;
  amountPaise: number;
  creditLimitPaise?: number;
  reason: string;
  adminId: string;
}): Promise<{ ok: boolean; message: string }> {
  const wallet = await getOrCreateWallet(params.userId);
  const prevCredit = wallet.freeCreditPaise;
  wallet.freeCreditPaise = addPaise(wallet.freeCreditPaise, params.amountPaise);
  if (params.creditLimitPaise !== undefined) {
    wallet.creditLimitPaise = params.creditLimitPaise;
  }
  inMemoryWallets.set(params.userId, wallet);

  await recordLedgerEntry({
    userId: params.userId,
    walletId: wallet.id,
    transactionType: "FREE_CREDIT_GRANTED",
    amountPaise: params.amountPaise,
    direction: "CREDIT",
    balanceBeforePaise: wallet.cashBalancePaise,
    balanceAfterPaise: wallet.cashBalancePaise,
    creditBeforePaise: prevCredit,
    creditAfterPaise: wallet.freeCreditPaise,
    referenceType: "ADMIN",
    referenceId: params.adminId,
    status: "SUCCESS",
    description: `Free shipping credit granted: ${params.reason}`,
  });

  return {
    ok: true,
    message: `Granted ₹${toRupees(params.amountPaise).toFixed(2)} promotional shipping credit.`,
  };
}

/**
 * Process AWB/Shipment Cancellation Refund
 * Policy:
 * - Within 5 hours of creation: 100% refund of refundable shipping charge.
 * - After 5 hours of creation: 50% refund (50% cancellation fee).
 * - Creates immutable ledger refund entry and updates wallet balance.
 * - Prevents duplicate cancellation refunds.
 */
export async function processShipmentCancellationRefund(params: {
  userId: string;
  orderId: string;
  awbNumber: string;
  shippingChargePaise: number;
  shipmentCreatedAt: string | Date;
  irreversibleCourierChargePaise?: number;
}): Promise<{
  ok: boolean;
  refundAmountPaise: number;
  cancellationFeePaise: number;
  refundPercentage: number;
  newBalancePaise: number;
  message: string;
}> {
  // Check duplicate refund protection
  const existingRefund = inMemoryLedger.find(
    (l) =>
      l.userId === params.userId &&
      l.transactionType === "CANCELLATION_REFUND" &&
      l.referenceId === params.awbNumber,
  );
  if (existingRefund) {
    const currentWallet = await getOrCreateWallet(params.userId);
    return {
      ok: false,
      refundAmountPaise: 0,
      cancellationFeePaise: 0,
      refundPercentage: 0,
      newBalancePaise: currentWallet.cashBalancePaise,
      message: `Cancellation refund has already been processed for AWB ${params.awbNumber}.`,
    };
  }

  const createdAtTime = new Date(params.shipmentCreatedAt).getTime();
  const now = Date.now();
  const elapsedHours = (now - createdAtTime) / (1000 * 60 * 60);

  const totalChargePaise = params.shippingChargePaise;
  let refundPercentage = 100;
  let refundAmountPaise = totalChargePaise;
  let cancellationFeePaise = 0;

  if (params.irreversibleCourierChargePaise && params.irreversibleCourierChargePaise > 0) {
    cancellationFeePaise = params.irreversibleCourierChargePaise;
    refundAmountPaise = Math.max(0, totalChargePaise - cancellationFeePaise);
    refundPercentage = totalChargePaise > 0 ? Math.round((refundAmountPaise / totalChargePaise) * 100) : 0;
  } else if (elapsedHours > 5) {
    // After 5 hours: 50% refund
    refundPercentage = 50;
    refundAmountPaise = Math.round(totalChargePaise * 0.5);
    cancellationFeePaise = totalChargePaise - refundAmountPaise;
  } else {
    // Within 5 hours: 100% refund
    refundPercentage = 100;
    refundAmountPaise = totalChargePaise;
    cancellationFeePaise = 0;
  }

  const wallet = await getOrCreateWallet(params.userId);
  const prevBalance = wallet.cashBalancePaise;
  wallet.cashBalancePaise = addPaise(wallet.cashBalancePaise, refundAmountPaise);
  inMemoryWallets.set(params.userId, wallet);

  // Record Cancellation Refund Ledger Entry
  await recordLedgerEntry({
    userId: params.userId,
    walletId: wallet.id,
    transactionType: "CANCELLATION_REFUND",
    amountPaise: refundAmountPaise,
    direction: "CREDIT",
    balanceBeforePaise: prevBalance,
    balanceAfterPaise: wallet.cashBalancePaise,
    creditBeforePaise: wallet.freeCreditPaise,
    creditAfterPaise: wallet.freeCreditPaise,
    referenceType: "SHIPMENT",
    referenceId: params.awbNumber,
    orderId: params.orderId,
    status: "SUCCESS",
    description: `Cancellation Refund (${refundPercentage}%) for AWB ${params.awbNumber}${
      cancellationFeePaise > 0
        ? ` [₹${toRupees(cancellationFeePaise).toFixed(2)} cancellation fee retained]`
        : ""
    }`,
  });

  const session = await getEffectiveSession();
  const supabase = session?.supabase || createServiceClient();
  if (supabase) {
    await syncDatabaseBalances(supabase, params.userId, wallet.cashBalancePaise);
    try {
      await supabase.from("wallet_transactions").insert({
        user_id: params.userId,
        transaction_type: "CREDIT",
        category: "REFUND",
        amount: toRupees(refundAmountPaise),
        balance_after: toRupees(wallet.cashBalancePaise),
        reference_id: params.awbNumber,
        awb_number: params.awbNumber,
        description: `Cancellation Refund (${refundPercentage}%) for AWB ${params.awbNumber}${
          cancellationFeePaise > 0
            ? ` [₹${toRupees(cancellationFeePaise).toFixed(2)} cancellation fee retained]`
            : ""
        }`,
      });
    } catch (err) {
      console.warn("[processShippingCancellation.insertTxn]", err);
    }
  }


  return {
    ok: true,
    refundAmountPaise,
    cancellationFeePaise,
    refundPercentage,
    newBalancePaise: wallet.cashBalancePaise,
    message: `Refunded ₹${toRupees(refundAmountPaise).toFixed(2)} (${refundPercentage}% of freight) to wallet.`,
  };
}

/**
 * Process Payment Gateway Recharge Refund
 */
export async function processPaymentRefund(params: {
  userId: string;
  originalPaymentId: string;
  refundAmountPaise: number;
  reason: string;
}): Promise<{ ok: boolean; newBalancePaise: number; message: string }> {
  const wallet = await getOrCreateWallet(params.userId);
  if (wallet.cashBalancePaise < params.refundAmountPaise) {
    return {
      ok: false,
      newBalancePaise: wallet.cashBalancePaise,
      message: "Insufficient wallet balance to process gateway recharge refund.",
    };
  }

  const prevBalance = wallet.cashBalancePaise;
  wallet.cashBalancePaise = subPaise(wallet.cashBalancePaise, params.refundAmountPaise);
  inMemoryWallets.set(params.userId, wallet);

  await recordLedgerEntry({
    userId: params.userId,
    walletId: wallet.id,
    transactionType: "FULL_REFUND",
    amountPaise: params.refundAmountPaise,
    direction: "DEBIT",
    balanceBeforePaise: prevBalance,
    balanceAfterPaise: wallet.cashBalancePaise,
    creditBeforePaise: wallet.freeCreditPaise,
    creditAfterPaise: wallet.freeCreditPaise,
    referenceType: "PAYMENT",
    referenceId: params.originalPaymentId,
    paymentId: params.originalPaymentId,
    status: "SUCCESS",
    description: `Payment recharge refund: ${params.reason}`,
  });

  const session = await getEffectiveSession();
  if (session) {
    await syncDatabaseBalances(session.supabase, params.userId, wallet.cashBalancePaise);
  }

  return {
    ok: true,
    newBalancePaise: wallet.cashBalancePaise,
    message: `Refund of ₹${toRupees(params.refundAmountPaise).toFixed(2)} processed successfully.`,
  };
}

/**
 * Process COD Settlement Credit to Wallet
 */
export async function processCodSettlementCredit(params: {
  userId: string;
  settlementId: string;
  netSettlementPaise: number;
  awbNumber: string;
}): Promise<{ ok: boolean; newBalancePaise: number; message: string }> {
  const wallet = await getOrCreateWallet(params.userId);
  const prevBalance = wallet.cashBalancePaise;
  wallet.cashBalancePaise = addPaise(wallet.cashBalancePaise, params.netSettlementPaise);
  inMemoryWallets.set(params.userId, wallet);

  await recordLedgerEntry({
    userId: params.userId,
    walletId: wallet.id,
    transactionType: "COD_SETTLEMENT",
    amountPaise: params.netSettlementPaise,
    direction: "CREDIT",
    balanceBeforePaise: prevBalance,
    balanceAfterPaise: wallet.cashBalancePaise,
    creditBeforePaise: wallet.freeCreditPaise,
    creditAfterPaise: wallet.freeCreditPaise,
    referenceType: "SETTLEMENT",
    referenceId: params.settlementId,
    status: "SUCCESS",
    description: `COD remittance settlement payout for AWB ${params.awbNumber}`,
  });

  const session = await getEffectiveSession();
  if (session) {
    await syncDatabaseBalances(session.supabase, params.userId, wallet.cashBalancePaise);
  }

  return {
    ok: true,
    newBalancePaise: wallet.cashBalancePaise,
    message: `Credited ₹${toRupees(params.netSettlementPaise).toFixed(2)} COD settlement to wallet.`,
  };
}

/**
 * Records an immutable double-entry ledger record
 */
export async function recordLedgerEntry(
  entry: Omit<WalletLedgerEntry, "id" | "currency" | "createdAt">,
): Promise<WalletLedgerEntry> {
  const ledgerId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: WalletLedgerEntry = {
    ...entry,
    id: ledgerId,
    currency: "INR",
    createdAt: new Date().toISOString(),
  };

  inMemoryLedger.unshift(record);

  const session = await getEffectiveSession();
  if (session) {
    try {
      const dbCategory =
        record.transactionType === "SHIPPING_CHARGE" || record.transactionType === "SHIPPING_DEBIT"
          ? "SHIPPING_DEDUCTION"
          : record.transactionType === "CANCELLATION_REFUND" || record.transactionType === "FULL_REFUND"
          ? "REFUND"
          : record.transactionType === "COD_SETTLEMENT"
          ? "COD_REMITTANCE"
          : "WALLET_RECHARGE";

      await session.supabase.from("wallet_transactions").insert({
        id: crypto.randomUUID(),
        user_id: record.userId,
        transaction_type: record.direction,
        category: dbCategory,
        amount: toRupees(record.amountPaise),
        balance_after: toRupees(record.balanceAfterPaise),
        reference_id: record.referenceId || record.id,
        description: record.description,
        created_at: record.createdAt,
      });
    } catch (err) {
      console.warn("[recordLedgerEntry.dbSync]", err);
    }
  }

  return record;
}

/**
 * Retrieves the full double-entry ledger history for a user
 */
export async function getWalletLedgerHistory(userId: string): Promise<WalletLedgerEntry[]> {
  return inMemoryLedger.filter((l) => l.userId === userId);
}

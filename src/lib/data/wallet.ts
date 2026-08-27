import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";
import {
  computeAvailableFunds,
  getOrCreateWallet,
  getWalletLedgerHistory,
} from "@/lib/finance/wallet-service";
import { toRupees } from "@/lib/finance/money";
import type { WalletTransaction } from "@/types";

export interface WalletSummary {
  userId?: string;
  availableBalance: number; // Actual amount currently available for creating shipments
  pendingCod: number;       // Amount expected from COD settlements
  totalUsed: number;        // Total amount spent on shipping charges
  isLowBalance: boolean;
  transactions: WalletTransaction[];
  isDemo: boolean;
}


export async function getWalletSummary(filterType?: string): Promise<WalletSummary> {
  const session = await getEffectiveSession();
  let userId = "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5";
  let supabase = null;

  if (session) {
    supabase = session.supabase;
    userId = session.user.id;
  }

  const serviceClient = createServiceClient();
  const db = serviceClient || supabase;

  // Get wallet state
  const walletAccount = await getOrCreateWallet(userId);
  const computed = computeAvailableFunds(walletAccount);
  const availableBalance = toRupees(computed.cashBalancePaise);

  let rawTxns: any[] = [];
  let shipments: any[] = [];

  if (db) {
    const [txnsResult, shipmentsResult] = await Promise.all([
      db
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      db
        .from("ecommerce_shipments")
        .select("id, shipping_charge, cod_amount, payment_mode, shipment_status, awb_number, created_at, order:orders(order_number)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    rawTxns = txnsResult.data ?? [];
    shipments = shipmentsResult.data ?? [];
  }

  // Also query in-memory ledger entries
  const inMemoryTxns = await getWalletLedgerHistory(userId);

  function normalizeCategory(cat: string, type: string) {
    if (cat === "SHIPPING_DEDUCTION" || cat === "SHIPPING_DEBIT") return "SHIPPING_CHARGE";
    if (cat === "REFUND") return "CANCELLATION_REFUND";
    if (cat === "COD_REMITTANCE") return "COD_SETTLEMENT";
    if (cat) return cat;
    return type === "CREDIT" ? "WALLET_RECHARGE" : "SHIPPING_CHARGE";
  }

  let mappedTxns: WalletTransaction[] = rawTxns.map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    transactionType: t.transaction_type,
    category: normalizeCategory(t.category, t.transaction_type) as any,
    amount: Number(t.amount),
    balanceAfter: Number(t.balance_after),
    referenceId: t.reference_id,
    description: t.description || `Prepaid wallet recharge of ₹${Number(t.amount).toFixed(2)}`,
    awbNumber:
      t.awb_number ||
      (t.description?.includes("AWB") ? t.description.match(/AWB\s+([A-Za-z0-9_-]+)/)?.[1] : null) ||
      (t.reference_id?.startsWith("SF") || t.reference_id?.startsWith("XB") ? t.reference_id : null),
    paymentGatewayReference: t.payment_gateway_reference,
    createdAt: t.created_at,
  }));

  // Merge in-memory transactions if not already in DB
  const existingIds = new Set(mappedTxns.map((m) => m.id));
  const existingAwbs = new Set(mappedTxns.map((m) => m.awbNumber).filter(Boolean));

  for (const im of inMemoryTxns) {
    if (!existingIds.has(im.id)) {
      const awb =
        im.referenceId?.startsWith("SF") || im.referenceId?.startsWith("XB") ? im.referenceId : null;
      if (awb) existingAwbs.add(awb);

      mappedTxns.push({
        id: im.id,
        userId: im.userId,
        transactionType: im.direction,
        category: normalizeCategory(im.transactionType, im.direction) as any,
        amount: toRupees(im.amountPaise),
        balanceAfter: toRupees(im.balanceAfterPaise),
        referenceId: im.referenceId,
        description: im.description,
        awbNumber: awb,
        createdAt: im.createdAt,
      });
      existingIds.add(im.id);
    }
  }

  // Merge every shipment that has a freight charge and isn't already logged
  for (const s of shipments) {
    const awb = s.awb_number;
    const charge = Number(s.shipping_charge || 0);
    if (awb && charge > 0 && !existingAwbs.has(awb)) {
      mappedTxns.push({
        id: `tx-shp-${awb}`,
        userId,
        transactionType: "DEBIT",
        category: "SHIPPING_CHARGE",
        amount: charge,
        balanceAfter: 0, // Will be computed in chronological running balance below
        referenceId: awb,
        awbNumber: awb,
        orderNumber: s.order?.order_number,
        description: `Shipping Charge for AWB ${awb}`,
        createdAt: s.created_at || new Date().toISOString(),
      });
      existingAwbs.add(awb);
    }
  }

  // Ensure if user has positive available balance but missing credit records in transactions, a topup entry is shown
  const totalRecordedCredits = mappedTxns
    .filter((t) => t.transactionType === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRecordedDebits = mappedTxns
    .filter((t) => t.transactionType === "DEBIT")
    .reduce((sum, t) => sum + t.amount, 0);
  const netRecorded = totalRecordedCredits - totalRecordedDebits;

  if (availableBalance > 0 && netRecorded < availableBalance) {
    const diff = Number((availableBalance - Math.max(0, netRecorded)).toFixed(2));
    if (diff > 0) {
      mappedTxns.push({
        id: `tx-rech-${userId.slice(0, 8)}`,
        userId,
        transactionType: "CREDIT",
        category: "WALLET_RECHARGE",
        amount: diff,
        balanceAfter: availableBalance,
        referenceId: "PAY_WALLET_RECHARGE",
        paymentGatewayReference: "Razorpay / UPI Instant Recharge",
        description: `Prepaid wallet recharge of ₹${diff.toFixed(2)}`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 1. Chronological order to guarantee exact historical running balance
  mappedTxns.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let running = 0;
  for (let i = 0; i < mappedTxns.length; i++) {
    const t = mappedTxns[i];
    if (t.balanceAfter && t.balanceAfter > 0 && t.balanceAfter !== availableBalance) {
      running = t.balanceAfter;
    } else {
      if (t.transactionType === "CREDIT") {
        running += t.amount;
      } else {
        running = Math.max(0, running - t.amount);
      }
      t.balanceAfter = running;
    }
  }

  // Ensure latest transaction's balanceAfter matches current available balance if known
  if (mappedTxns.length > 0 && availableBalance > 0) {
    const last = mappedTxns[mappedTxns.length - 1];
    if (last.balanceAfter !== availableBalance) {
      last.balanceAfter = availableBalance;
    }
  }

  // 2. Sort latest first for UI presentation
  mappedTxns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (filterType && filterType !== "ALL") {
    mappedTxns = mappedTxns.filter((t) => t.transactionType === filterType || t.category === filterType);
  }

  const totalUsed = shipments.reduce(
    (sum, s: any) => sum + Number(s.shipping_charge || 0),
    0,
  );

  const pendingCod = shipments
    .filter((s: any) => s.payment_mode === "COD" && s.shipment_status !== "DELIVERED")
    .reduce((sum, s: any) => sum + Number(s.cod_amount || 0), 0);

  return {
    userId,
    availableBalance,
    pendingCod,
    totalUsed,
    isLowBalance: availableBalance < 200,
    transactions: mappedTxns,
    isDemo: false,
  };
}

